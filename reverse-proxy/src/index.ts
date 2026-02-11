import express from 'express';
import cors from 'cors';
import httpProxy from 'http-proxy';
import dotenv from 'dotenv';
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const proxy = httpProxy.createProxyServer();
const port = parseInt(process.env.PORT || '3001', 10);
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
    console.error('❌ BASE_URL environment variable is not set!');
    console.error('⚠️  Reverse proxy will not work correctly');
}

const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

app.use(async (req, res) => {
    try {
        const hostname = req.hostname;
        console.log('hostname', hostname);
        const subdomain = hostname.split('.')[0];
        console.log('subdomain', subdomain);

        // Find project by subdomain
        const projects = await prisma.project.findMany({ where: { subDomain: subdomain } });

        if (!projects || projects.length === 0) {
            return res.status(404).json({ error: 'Project not found for subdomain: ' + subdomain });
        }

        if (!BASE_URL) {
            return res.status(500).json({ error: 'BASE_URL not configured' });
        }

        // Construct target URL: BASE_URL + projectId
        const resolvesTo = `${BASE_URL}${projects[0].id}`;
        console.log('Proxying to:', resolvesTo);
        
        return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
    } catch (error) {
        console.error('Error in reverse proxy:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/') proxyReq.path += 'index.html';
});

proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'reverse-proxy', port });
});

// Bind to 0.0.0.0 so Railway can reach it
app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server-reverse-proxy]: Server is running at http://0.0.0.0:${port}`);
    console.log(`📡 Listening on port ${port}`);
    console.log(`🔗 Health check: http://0.0.0.0:${port}/health`);
});

export default app;