# Launchpad

> "Ship fast. Preview instantly."

Launchpad is a self-hosted, one-click deployment platform that enables automatic deployments from GitHub repositories. It provides a simplified workflow for deploying web applications with instant preview URLs and real-time build logs.

## 🚀 Features

- **GitHub Repository Deployment**: Deploy any GitHub repository with a single URL
- **Real-time Build Logs**: View the build process in real-time
- **Preview Environments**: Access your deployment through custom preview URLs
- **Authentication**: Secure login with Email/Password and GitHub OAuth (powered by Better Auth)
- **Modern UI**: Dark mode, Bricolage Grotesque typography, and sleek design
- **Microservice Architecture**: Scalable services for building, uploading, and serving content

## 🏗️ Architecture

This project consists of multiple services working together:

- **Frontend**: Next.js application (Launchpad UI)
- **Upload Service**: Handles repository submissions and initiates the build process
- **Build Service**: Builds and prepares applications for deployment
- **Reverse Proxy**: Routes traffic to the correct deployment based on subdomains

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Better Auth
- **Design**: Bricolage Grotesque Font, Lucide Icons
- **Backend / Services**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Services) / SQLite (Auth) with Prisma ORM
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

## 🚦 Getting Started

### Clone the repository

```bash
git clone https://github.com/yourusername/launchpad.git
cd launchpad
```

### Environment Setup

Create `.env` files for each service with the necessary configuration values.

### Starting the services

1. **Start the Frontend (Launchpad)**

```bash
cd frontend
npm install
# Configure .env with your Auth secrets
npx prisma db push
npm run dev
```

The frontend will be available at http://localhost:3000

2. **Start the Upload Service**

```bash
cd upload-service
npm install
npm run dev
```

3. **Start the Reverse Proxy**

```bash
cd reverse-proxy
npm install
npm run dev
```

## 🔧 Development

Each service can be developed independently. 

### Frontend Auth Setup
To enable GitHub OAuth:
1. Create a GitHub OAuth App
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `frontend/.env`
3. Ensure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are set.