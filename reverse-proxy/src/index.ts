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

// Health check endpoint (MUST be before catch-all routes)
app.get('/health', (req, res) => {
    console.log('Health check request received');
    res.json({
        status: 'ok',
        service: 'reverse-proxy',
        port,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'reverse-proxy',
        message: 'Reverse proxy service is running',
        endpoints: {
            health: '/health',
            preview: '/preview/:subdomain/*'
        }
    });
});

// Cache to store subdomain -> projectId mapping to avoid DB hits for every asset
const projectCache = new Map<string, string>();

// Middleware to handle assets (/_next, /static, /favicon.ico, etc)
// that are requested from inside a preview page
app.use(async (req, res, next) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    // If request is NOT for a specific preview route AND NOT a custom domain
    // We try to figure out the project from the Referer
    if (!req.path.startsWith('/preview/') && !req.path.startsWith('/health') && req.path !== '/') {
        const referer = req.headers.referer;
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                const pathParts = refererUrl.pathname.split('/');
                // Check if referer is /preview/SUBDOMAIN
                if (pathParts[1] === 'preview' && pathParts[2]) {
                    const subDomain = pathParts[2];

                    let projectId = projectCache.get(subDomain);
                    if (!projectId) {
                        const projects = await prisma.project.findMany({ where: { subDomain } });
                        if (projects.length > 0) {
                            projectId = projects[0].id;
                            projectCache.set(subDomain, projectId);
                        }
                    }

                    if (projectId && BASE_URL) {
                        const target = `${BASE_URL}${projectId}`;
                        console.log(`📦 Asset proxy: ${req.url} -> ${target}${req.url} (Referer: ${subDomain})`);
                        return proxy.web(req, res, { target, changeOrigin: true });
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }
    next();
});

// Path-based preview (no custom domain needed): /preview/:subDomain and /preview/:subDomain/*
// Example: https://your-reverse-proxy.up.railway.app/preview/abundant-old-father
app.use('/preview/:subDomain', async (req, res) => {
    try {
        const subDomain = req.params.subDomain;
        console.log('📱 Preview request for subdomain:', subDomain, 'path:', req.url);

        if (!subDomain) {
            console.warn('⚠️  No subdomain provided');
            return res.status(400).json({ error: 'Subdomain required' });
        }
        const projects = await prisma.project.findMany({ where: { subDomain } });
        if (!projects || projects.length === 0) {
            console.warn('⚠️  Project not found for:', subDomain);
            return res.status(404).json({ error: 'Project not found for: ' + subDomain });
        }
        if (!BASE_URL) {
            console.error('❌ BASE_URL not configured');
            return res.status(500).json({ error: 'BASE_URL not configured' });
        }
        const target = `${BASE_URL}${projects[0].id}`;
        // req.url is the path after the mount (e.g. '' or '/' or '/static/js/main.js')
        req.url = req.url || '/';
        console.log('✅ Proxying /preview/' + subDomain + ' to:', target, 'path:', req.url);
        return proxy.web(req, res, { target, changeOrigin: true });
    } catch (error) {
        console.error('❌ Error in reverse proxy (path-based):', error);
        return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Subdomain-based routing (when using a custom domain with wildcard DNS)
app.use(async (req, res) => {
    try {
        const hostname = req.hostname;
        console.log('🌐 Incoming request - hostname:', hostname, 'path:', req.url);

        const subdomain = hostname.split('.')[0];
        console.log('📋 Extracted subdomain:', subdomain);

        // Find project by subdomain
        const projects = await prisma.project.findMany({ where: { subDomain: subdomain } });

        if (!projects || projects.length === 0) {
            console.warn('⚠️  Project not found for subdomain:', subdomain);
            return res.status(404).json({ error: 'Project not found for subdomain: ' + subdomain });
        }

        if (!BASE_URL) {
            console.error('❌ BASE_URL not configured');
            return res.status(500).json({ error: 'BASE_URL not configured' });
        }

        const project = projects[0];
        const resolvesTo = `${BASE_URL}${project.id}`;

        // If the request is for root '/', append index.html
        if (req.url === '/') {
            req.url = '/index.html';
        }

        console.log(`✅ Proxying ${hostname}${req.url} -> ${resolvesTo}${req.url}`);

        return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
    } catch (error) {
        console.error('❌ Error in reverse proxy:', error);
        return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    // Modify the path in the outgoing request to S3 if needed
    if (req.url === '/') {
        proxyReq.path += 'index.html';
    }
});

proxy.on('error', (err: Error, _req: import('http').IncomingMessage, res: unknown) => {
    console.error('Proxy error:', err);
    const response = res as express.Response;
    if (response && typeof response.headersSent !== 'undefined' && !response.headersSent) {
        response.status(500).json({ error: 'Proxy error', message: err.message });
    }
});

// Bind to 0.0.0.0 explicitly (Required for Railway)
const server = app.listen(port, '0.0.0.0', () => {
    const address = server.address();
    console.log(`⚡️[server-reverse-proxy]: Server is running at http://0.0.0.0:${port}`);
    console.log(`📡 Listening on port ${port}`);
    console.log(`🔗 Health check: http://0.0.0.0:${port}/health`);
    console.log('Server address:', address);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep running if possible, or exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

export default app;