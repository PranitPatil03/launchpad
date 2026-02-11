import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import dotenv from 'dotenv';
import express from 'express';
import { Kafka } from "kafkajs";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from 'random-word-slugs';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);
const app = express();

// Initialize AWS ECS Client
const ecsClient = new ECSClient({
    region: process.env.REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.CREDENTIALS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CREDENTIALS_SECRET_ACCESS_KEY || ''
    }
});

// Initialize ClickHouse client with error handling
let client: ClickHouseClient | null = null;
try {
    client = createClient({
        host: process.env.CLICKHOUSE_HOST,
        database: process.env.CLICKHOUSE_DATABASE,
        username: process.env.CLICKHOUSE_USER,
        password: process.env.CLICKHOUSE_PASSWORD
    });
    console.log('✅ ClickHouse client initialized');
} catch (err) {
    console.error('⚠️  ClickHouse client initialization failed:', err);
    console.log('⚠️  Service will continue but logs may not be stored in ClickHouse');
}

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Kafka (with error handling for missing kafka.pem)
let kafka: Kafka | null = null;
let consumer: ReturnType<Kafka['consumer']> | null = null;

try {
    // Get Kafka CA certificate from file or environment variable
    let kafkaCaCert: string | null = null;

    // First, try to read from environment variable (for Railway deployment)
    if (process.env.KAFKA_CA_CERT) {
        kafkaCaCert = process.env.KAFKA_CA_CERT;
        console.log('✅ Found Kafka CA certificate from KAFKA_CA_CERT environment variable');
    } else {
        // Try to read from file (for local development)
        const possiblePaths = [
            path.join(__dirname, '..', 'kafka.pem'),  // If __dirname is /app/src
            path.join(process.cwd(), 'kafka.pem'),     // If cwd is /app
            '/app/kafka.pem',                          // Absolute path in Railway
            'kafka.pem'                                // Relative to cwd
        ];

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                kafkaCaCert = fs.readFileSync(testPath, 'utf-8');
                console.log(`✅ Found kafka.pem at: ${testPath}`);
                break;
            }
        }
    }

    // Validate Kafka configuration
    if (!process.env.BROKER1) {
        console.warn('⚠️  BROKER1 environment variable not set');
        console.warn('⚠️  Kafka consumer will not be initialized');
    } else if (!kafkaCaCert) {
        console.warn('⚠️  Kafka CA certificate not found (neither KAFKA_CA_CERT env var nor kafka.pem file)');
        console.warn('⚠️  Kafka consumer will not be initialized');
        console.warn('⚠️  Current working directory:', process.cwd());
        console.warn('⚠️  __dirname:', __dirname);
    } else {
        // Initialize Kafka client
        kafka = new Kafka({
            clientId: `api-server`,
            brokers: [process.env.BROKER1],
            connectionTimeout: 30000,
            authenticationTimeout: 30000,
            ssl: { ca: [kafkaCaCert] },
            sasl: {
                mechanism: 'plain',
                username: process.env.SASL_USERNAME || '',
                password: process.env.SASL_PASSWORD || ''
            }
        });
        consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' });
        console.log('✅ Kafka client initialized');
        console.log(`📡 Kafka broker: ${process.env.BROKER1}`);
    }
} catch (err) {
    console.error('⚠️  Failed to initialize Kafka:', err);
    console.log('⚠️  Service will continue without Kafka consumer');
}


// ECS config: container name must match your task definition exactly
const config = {
    CLUSTER: process.env.CONFIG_CLUSTER,
    TASK: process.env.CONFIG_TASK,
    CONTAINER_NAME: process.env.CONFIG_CONTAINER_NAME || 'builder-image'
}

// CORS configuration - manual handling for maximum compatibility
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Allow all origins (you can restrict this later using ALLOWED_ORIGINS env var)
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight OPTIONS request immediately
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'upload-service',
        kafka: kafka ? 'connected' : 'not configured',
        clickhouse: client ? 'connected' : 'not configured'
    });
});

// Create a new project
app.post('/project', async (req, res) => {
    try {
        const schema = z.object({ name: z.string(), gitURL: z.string().url() });
        const safeParseResult = schema.safeParse(req.body);

        if (!safeParseResult.success) {
            return res.status(400).json({ error: 'Invalid request body', details: safeParseResult.error.errors });
        }

        const { name, gitURL } = safeParseResult.data;
        const project = await prisma.project.create({
            data: {
                name,
                gitURL,
                subDomain: generateSlug()
            }
        });

        return res.json({ status: 'success', data: { project } });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Failed to create project' });
    }
});

app.post('/deploy', async (req, res) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create deployment record
        const deployment = await prisma.deployement.create({
            data: {
                project: { connect: { id: projectId } },
                status: 'QUEUED'
            }
        });

        // Validate ECS config
        if (!config.CLUSTER || !config.TASK) {
            console.error('ECS config missing:', config);
            return res.status(500).json({ error: 'ECS configuration not set' });
        }

        // Trigger ECS task
        const command = new RunTaskCommand({
            cluster: config.CLUSTER,
            taskDefinition: config.TASK,
            launchType: 'FARGATE',
            count: 1,
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: 'ENABLED',
                    subnets: [
                        process.env.AWSCONFIG_SUBNETS1 || '',
                        process.env.AWSCONFIG_SUBNETS2 || '',
                        process.env.AWSCONFIG_SUBNETS3 || ''
                    ].filter(Boolean), // Remove empty strings
                    securityGroups: [process.env.AWSCONFIG_SECURITYGROUPS || ''].filter(Boolean),
                }
            },
            overrides: {
                containerOverrides: [
                    {
                        name: config.CONTAINER_NAME,
                        environment: [
                            { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                            { name: 'PROJECT_ID', value: projectId },
                            { name: 'DEPLOYEMENT_ID', value: deployment.id }
                        ]
                    }
                ]
            }
        });

        await ecsClient.send(command);
        console.log(`✅ ECS task queued for deployment ${deployment.id}`);

        return res.json({ status: 'queued', data: { deploymentId: deployment.id } });
    } catch (error) {
        console.error('Error deploying:', error);
        return res.status(500).json({ error: 'Failed to queue deployment', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

app.get('/logs/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!client) {
            return res.status(503).json({ error: 'ClickHouse client not available', logs: [] });
        }
        const logs = await client.query({
            query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
            query_params: { deployment_id: id },
            format: 'JSONEachRow'
        })

        const rawLogs = await logs.json()
        return res.json({ logs: rawLogs })
    } catch (err) {
        console.error('Error fetching logs:', err);
        return res.status(500).json({ error: 'Failed to fetch logs', logs: [] });
    }
});

async function initkafkaConsumer() {
    if (!consumer) {
        console.log('⚠️  Kafka consumer not initialized, skipping');
        return;
    }

    try {
        await consumer.connect();
        await consumer.subscribe({ topics: ['container-logs'], fromBeginning: true });

        await consumer.run({
            eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
                const messages = batch.messages;
                for (const message of messages) {
                    if (!message.value) continue;

                    try {
                        const stringMessage = message.value.toString();
                        const { DEPLOYEMENT_ID, log } = JSON.parse(stringMessage);

                        // Insert log into ClickHouse if available
                        if (client) {
                            try {
                                await client.insert({
                                    table: 'log_events',
                                    values: [{
                                        event_id: uuidv4(),
                                        deployment_id: DEPLOYEMENT_ID,
                                        log
                                    }],
                                    format: 'JSONEachRow'
                                });
                            } catch (err) {
                                console.error('Error inserting log to ClickHouse:', err);
                            }
                        } else {
                            console.log(`[${DEPLOYEMENT_ID}] ${log}`);
                        }

                        resolveOffset(message.offset);
                        const offsets = {
                            topics: [{ topic: batch.topic, partitions: [{ partition: batch.partition, offset: message.offset }] }]
                        };
                        await commitOffsetsIfNecessary(offsets);
                        await heartbeat();
                    } catch (err) {
                        console.error('Error processing Kafka message:', err);
                        // Still resolve offset to prevent reprocessing
                        resolveOffset(message.offset);
                        const offsets = {
                            topics: [{ topic: batch.topic, partitions: [{ partition: batch.partition, offset: message.offset }] }]
                        };
                        await commitOffsetsIfNecessary(offsets);
                        await heartbeat();
                    }
                }
            }
        });

        console.log('✅ Kafka consumer connected and subscribed to container-logs');
    } catch (err) {
        console.error('❌ Failed to initialize Kafka consumer:', err);
        console.log('⚠️  Service will continue without Kafka consumer (logs may not be stored)');
    }
}

async function initClickHouseSchema() {
    if (!client) return;
    try {
        await client.query({
            query: `CREATE TABLE IF NOT EXISTS log_events (
                event_id String,
                deployment_id String,
                log String,
                timestamp DateTime DEFAULT now()
            )
            ENGINE = MergeTree()
            ORDER BY (deployment_id, timestamp)`
        });
        console.log('✅ ClickHouse table "log_events" checked/created');
    } catch (err) {
        console.error('❌ Failed to create/check ClickHouse table:', err);
    }
}

// Start server first, then initialize Kafka consumer (non-blocking)
// Bind to 0.0.0.0 so Railway can reach it
app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server-upload-service]: Server is running at http://0.0.0.0:${port}`);
    console.log(`📡 Listening on port ${port}`);
    console.log(`🔗 Health check: http://0.0.0.0:${port}/health`);

    // Initialize ClickHouse Schema
    initClickHouseSchema();

    // Initialize Kafka consumer after server starts (non-blocking)
    if (consumer) {
        initkafkaConsumer().catch(err => {
            console.error('Failed to start Kafka consumer:', err);
        });
    } else {
        console.log('⚠️  Kafka consumer not initialized, skipping');
    }
});