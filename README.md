# Launchpad

**Ship fast. Preview instantly.**

Launchpad is a modern one-click deployment platform with real-time logs and preview environments. Built with Better-Auth for secure authentication and featuring a sleek black UI with Bricolage Grotesque typography.

## 🚀 Features

- **One-Click Deployment**: Deploy any GitHub repository with a single click
- **Secure Authentication**: Email/password and GitHub OAuth using Better-Auth
- **Real-time Build Logs**: Watch your deployment process live with streaming logs
- **Preview Environments**: Access your deployments instantly through custom preview URLs
- **User Management**: Each user can manage their own projects and deployments
- **Modern UI**: Beautiful black interface with Bricolage Grotesque font
- **Microservice Architecture**: Scalable services for building, uploading, and serving content
- **Event-Driven Design**: Kafka-based event processing for reliable build notifications

## 🏗️ Architecture

This project consists of multiple services working together:

- **Frontend**: Next.js application with Better-Auth integration providing the user interface
- **Upload Service**: Handles authentication, repository submissions, and initiates the build process
- **Build Service**: Builds and prepares applications for deployment
- **Reverse Proxy**: Routes traffic to the correct deployment based on subdomains

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Better-Auth, Radix UI
- **Backend**: Node.js, Express, TypeScript, Better-Auth
- **Authentication**: Better-Auth with GitHub OAuth and email/password
- **Database**: PostgreSQL with Prisma ORM
- **Design**: Black theme with Bricolage Grotesque typography
- **Messaging**: Kafka for event streaming
- **Storage**: AWS S3 for deployment artifacts
- **Containerization**: Docker for build isolation
- **Infrastructure**: AWS ECS for container orchestration
- **Observability**: ClickHouse for log storage and analysis

## 📋 Prerequisites

- Node.js v18 or higher
- Docker and Docker Compose
- AWS account (for S3 and ECS)
- Kafka cluster
- PostgreSQL database
- GitHub OAuth App (for authentication)

## 🚦 Getting Started

### Clone the repository

```bash
git clone https://github.com/yourusername/launchpad.git
cd launchpad
```

### Environment Setup

Create `.env` files for each service with the necessary configuration values.

#### Frontend (.env)
```env
NEXT_PUBLIC_UPLOAD_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001/api/auth
NEXT_PUBLIC_PREVIEW_BASE_URL=http://localhost:3002/*
```

#### Upload Service (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/launchpad"
BETTER_AUTH_URL="http://localhost:3001/api/auth"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
# Add other environment variables for AWS, Kafka, ClickHouse
```

### Database Setup

1. Run database migrations:
```bash
cd upload-service
npx prisma migrate dev
npx prisma generate
```

### Starting the services

1. **Start the Frontend**

```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at http://localhost:3002

2. **Start the Upload Service**

```bash
cd upload-service
npm install
npm run dev
```
The upload service API will be available at http://localhost:3001

3. **Start the Reverse Proxy**

```bash
cd reverse-proxy
npm install
npm run dev
```
The reverse proxy will be available at http://localhost:3003

## 🔧 Development

Each service can be developed independently. Follow these steps to set up the development environment for each service:

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Upload Service

```bash
cd upload-service
npm install
npm run dev
```

The upload service API will be available at http://localhost:3000

### Reverse Proxy

```bash
cd reverse-proxy
npm install
npm run dev
```

The reverse proxy will be available at http://localhost:3001

### Build Service

The build service runs within Docker containers and is triggered by the upload service.
