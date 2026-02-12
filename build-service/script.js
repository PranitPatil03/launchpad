const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const { exec } = require('child_process')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { Kafka } = require('kafkajs')

dotenv = require('dotenv');

dotenv.config();

console.log('Building service...');

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYEMENT_ID = process.env.DEPLOYEMENT_ID;

// Helper to handle multiline certs from env vars
const formatCert = (cert) => {
    if (!cert) return '';
    return cert.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}

// Prepare SSL config
const sslConfig = { rejectUnauthorized: false }; // Allow self-signed certs
if (process.env.KAFKA_CA_CERT) {
    sslConfig.ca = [formatCert(process.env.KAFKA_CA_CERT)];
}
// Support mTLS if provided
if (process.env.KAFKA_CLIENT_CERT && process.env.KAFKA_CLIENT_KEY) {
    sslConfig.cert = formatCert(process.env.KAFKA_CLIENT_CERT);
    sslConfig.key = formatCert(process.env.KAFKA_CLIENT_KEY);
}

const kafkaConfig = {
    clientId: `docker-build-server-${DEPLOYEMENT_ID}`,
    brokers: [process.env.BROKER1],
    connectionTimeout: 30000,
    authenticationTimeout: 30000,
    ssl: sslConfig
};

// Only use SASL if we don't have client certificates (mTLS)
if (!sslConfig.cert && !sslConfig.key) {
    console.log('Using SASL Authentication');
    kafkaConfig.sasl = {
        mechanism: 'scram-sha-256',
        username: process.env.SASL_USERNAME,
        password: process.env.SASL_PASSWORD
    };
} else {
    console.log('Using mTLS Authentication');
}

const kafka = new Kafka(kafkaConfig);

const producer = kafka.producer();

async function publishLog(log) {
    try {
        await producer.send({ topic: `container-logs`, messages: [{ key: 'log', value: JSON.stringify({ PROJECT_ID, DEPLOYEMENT_ID, log }) }] })
    } catch (e) {
        console.error('Failed to send log to Kafka:', e);
    }
}

const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.CREDENTIALS_ACCESS_KEY_ID,
        secretAccessKey: process.env.CREDENTIALS_SECRET_ACCESS_KEY
    }
});


async function main() {
    await producer.connect()
    await publishLog('Build Started...')
    const outDir = path.join(__dirname, 'output');

    // Detect package manager
    let installCmd = 'npm install';
    let buildCmd = 'npm run build';

    if (fs.existsSync(path.join(outDir, 'pnpm-lock.yaml'))) {
        installCmd = 'pnpm install';
        buildCmd = 'pnpm run build';
        await publishLog('Detected pnpm project');
    } else if (fs.existsSync(path.join(outDir, 'yarn.lock'))) {
        installCmd = 'yarn install';
        buildCmd = 'yarn run build';
        await publishLog('Detected yarn project');
    } else {
        await publishLog('Detected npm project');
    }

    // Force Next.js Static Export
    // Check for next.config.ts first (TypeScript)
    const nextConfigTsPath = path.join(outDir, 'next.config.ts');
    if (fs.existsSync(nextConfigTsPath)) {
        await publishLog('Detected Next.js (TS), enforcing static export...');
        let method = 'append'; // Default to append if we can't parse easily
        let configContent = fs.readFileSync(nextConfigTsPath, 'utf8');

        // Simple regex to find if output: 'export' is missing
        if (!configContent.includes("output: 'export'")) {
            // If it has 'const nextConfig = {', we try to inject it
            if (configContent.includes('const nextConfig: NextConfig = {')) {
                configContent = configContent.replace('const nextConfig: NextConfig = {', "const nextConfig: NextConfig = {\n  output: 'export',");
            } else if (configContent.includes('const nextConfig = {')) {
                configContent = configContent.replace('const nextConfig = {', "const nextConfig = {\n  output: 'export',");
            } else {
                // Fallback: Just append it to the end (might break if strictly typed but often works for simple configs)
                // Actually, appending usually is safest if we can't parse. But let's try safely.
                // If we can't safely inject, we might just warn.
                await publishLog('WARNING: Could not automatically inject "output: export" into next.config.ts. Please ensure it is set manually.');
            }
            fs.writeFileSync(nextConfigTsPath, configContent);
        }
    } else {
        // Check for next.config.js (JavaScript)
        const nextConfigJsPath = path.join(outDir, 'next.config.js');
        if (fs.existsSync(nextConfigJsPath)) {
            await publishLog('Detected Next.js (JS), enforcing static export...');
            let configContent = fs.readFileSync(nextConfigJsPath, 'utf8');
            if (!configContent.includes("output: 'export'") && !configContent.includes('output: "export"')) {
                if (configContent.includes('nextConfig = {')) {
                    configContent = configContent.replace('nextConfig = {', "nextConfig = {\n  output: 'export',");
                    fs.writeFileSync(nextConfigJsPath, configContent);
                }
            }
        }
    }

    const buildProcess = exec(`cd ${outDir} && ${installCmd} && ${buildCmd}`);

    buildProcess.stdout.on('data', (data) => console.log(data) || publishLog(data.toString()));
    buildProcess.stderr.on('data', (data) => console.error(data) || publishLog(data.toString()));

    buildProcess.on('close', async function (code) {
        if (code !== 0) {
            await publishLog(`Build Failed with exit code ${code}`);
            console.error(`Build failed with exit code ${code}`);
            process.exit(code);
        }
        await publishLog(`Build Complete`)

        // Check for static export output (out), then others
        let distDir = path.join(__dirname, 'output', 'out'); // Next.js Static Export default

        if (!fs.existsSync(distDir)) {
            distDir = path.join(__dirname, 'output', 'dist'); // Vite
        }
        if (!fs.existsSync(distDir)) {
            distDir = path.join(__dirname, 'output', 'build'); // CRA
        }
        // Fallback to .next ONLY if we failed to export (but S3 might not serve it correctly without export)
        if (!fs.existsSync(distDir)) {
            const nextDir = path.join(__dirname, 'output', '.next');
            if (fs.existsSync(nextDir)) {
                await publishLog('WARNING: Using .next folder. This may not work on S3/Vercel-Clone without "output: export"');
                distDir = nextDir;
            }
        }

        if (!fs.existsSync(distDir)) {
            await publishLog(`ERROR: Could not find build output directory (checked out, dist, build, .next)`);
            console.error('Build output not found');
            process.exit(1);
        }

        const distDirContent = fs.readdirSync(path.resolve(distDir), { recursive: true });

        await publishLog(`Uploading service to S3...`)
        for (const file of distDirContent) {
            const filePath = path.join(distDir, file);

            if (fs.lstatSync(filePath).isDirectory()) continue;

            await publishLog(`Uploading ${file}...`)
            const command = new PutObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            });
            await s3Client.send(command)
            await publishLog(`Uploaded ${file}`)
        }
        await publishLog('Service uploaded');
        console.log('Service uploaded');
        process.exit(0);
    });
}
main();