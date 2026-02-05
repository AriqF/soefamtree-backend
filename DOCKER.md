# Docker Setup Guide for SoeFamTree Backend

This guide explains how to build and run the SoeFamTree backend application using Docker.

## Files Overview

- **`Dockerfile`**: Multi-stage production-optimized Docker image
- **`.dockerignore`**: Files to exclude from Docker build
- **`docker-compose.yml`**: Complete stack with PostgreSQL and backend app

## Quick Start with Docker Compose

### 1. Prerequisites
- Docker and Docker Compose installed
- Copy `.env.example` to `.env` and configure your environment variables

### 2. Start the Application
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### 3. Run Database Migrations
```bash
# Run migrations
docker-compose exec app pnpm migration:run

# Or generate new migrations
docker-compose exec app pnpm migration:generate src/migrations/YourMigrationName
```

### 4. Access the Application
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
  - Username: `developer`
  - Password: Your `API_DOCS_KEY` from `.env`
- **Health Check**: http://localhost:8000/health

### 5. Stop the Application
```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Building Docker Image Manually

### Production Build
```bash
# Build the image
docker build -t soefamtree-backend:latest .

# Run the container
docker run -d \
  --name soefamtree-backend \
  -p 8000:8000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your-password \
  -e DB_DATABASE=soefamtree \
  -e JWT_SECRET=your-secret-key \
  soefamtree-backend:latest
```

### Build with specific tag
```bash
docker build -t soefamtree-backend:v1.0.0 .
```

## Docker Image Details

### Multi-Stage Build
The Dockerfile uses a multi-stage build for optimization:

1. **Stage 1 (deps)**: Installs all dependencies
2. **Stage 2 (builder)**: Builds the TypeScript application
3. **Stage 3 (runner)**: Final production image with only necessary files

### Benefits
- ✅ Small image size (~200MB vs ~1GB)
- ✅ Faster deployments
- ✅ Secure (runs as non-root user)
- ✅ Layer caching for faster rebuilds

### Security Features
- Runs as non-root user (`nestjs:nodejs`)
- Only production dependencies included
- No source code in final image (only compiled dist)
- Health check included

## Environment Variables

### Required Variables
```bash
DB_HOST=postgres              # Database host
DB_PORT=5432                  # Database port
DB_USERNAME=postgres          # Database username
DB_PASSWORD=your-password     # Database password
DB_DATABASE=soefamtree        # Database name
JWT_SECRET=your-secret-key    # JWT secret for authentication
```

### Optional Variables
```bash
PORT=8000                     # Application port (default: 8000)
NODE_ENV=production           # Node environment
ENABLE_API_DOCS=1             # Enable Swagger docs (1=yes, 0=no)
API_DOCS_KEY=your-docs-pwd    # Password for API documentation
JWT_EXPIRES_IN=7d             # JWT token expiration
```

## Docker Compose Services

### Services Included
- **postgres**: PostgreSQL 16 database with health check
- **app**: NestJS backend application

### Volumes
- `postgres_data`: Persistent PostgreSQL data

### Networks
Docker Compose automatically creates a network for service communication.

## Development Workflow

### Local Development with Docker
```bash
# Start only the database
docker-compose up -d postgres

# Run app locally
pnpm install
pnpm start:dev

# Use database at localhost:5432
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build app
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Execute Commands in Container
```bash
# Open shell
docker-compose exec app sh

# Run migrations
docker-compose exec app pnpm migration:run

# Check Node version
docker-compose exec app node --version
```

## Production Deployment

### Environment Considerations
1. **Update environment variables** in `.env` or set them in your deployment platform
2. **Use strong passwords** for database and JWT secret
3. **Disable API docs** in production if not needed (`ENABLE_API_DOCS=0`)
4. **Use environment-specific configs**

### Deployment Platforms

#### Deploy to DigitalOcean/AWS/GCP
```bash
# Build for your platform
docker build --platform linux/amd64 -t soefamtree-backend:latest .

# Push to registry
docker tag soefamtree-backend:latest your-registry/soefamtree-backend:latest
docker push your-registry/soefamtree-backend:latest
```

#### Deploy to Kubernetes
Create deployment manifests or use Helm charts.

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Common issues:
# - Database not ready: Wait for postgres health check
# - Port conflict: Change PORT in .env
# - Missing env vars: Check .env file
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps

# Test database connection
docker-compose exec postgres psql -U postgres -d soefamtree
```

### Reset everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove Docker images
docker rmi soefamtree-backend

# Start fresh
docker-compose up -d --build
```

## Health Check

The application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "uptime": 123.456
}
```

Docker health checks run every 30 seconds and will mark the container as unhealthy if it fails 3 times.

## Performance Tips

1. **Use BuildKit** for faster builds:
   ```bash
   DOCKER_BUILDKIT=1 docker build -t soefamtree-backend .
   ```

2. **Layer caching**: Place frequently changing files (source code) after dependencies in Dockerfile

3. **Multi-platform builds**: Build for multiple architectures:
   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 -t soefamtree-backend .
   ```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Best Practices](https://docs.nestjs.com/recipes/deployment)
