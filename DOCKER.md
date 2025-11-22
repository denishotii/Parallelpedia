# Docker Setup for Parallelpedia

This guide explains how to build and run Parallelpedia using Docker.

## Quick Start

### Build the Docker Image

```bash
docker build -t parallelpedia:latest .
```

### Run the Container

```bash
docker run -d \
  --name parallelpedia \
  -p 5173:5173 \
  -p 8000:8000 \
  -p 9200:9200 \
  -p 8081:8081 \
  parallelpedia:latest
```

### Access the Services

Once the container is running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Backend API Docs**: http://localhost:8000/docs
- **DKG Node**: http://localhost:9200
- **DKG Node UI**: http://localhost:8081

## Environment Variables

You can override environment variables by creating a `.env` file or passing them to `docker run`:

### Backend Environment Variables

Create a `backend/.env` file or pass via `-e`:

```bash
docker run -d \
  --name parallelpedia \
  -p 5173:5173 -p 8000:8000 -p 9200:9200 -p 8081:8081 \
  -e DKG_BASE_URL=http://localhost:9200 \
  -e OPENAI_API_KEY=your-key-here \
  -e DKG_OTNODE_URL=https://v6-pegasus-node-02.origin-trail.network:8900 \
  -e DKG_PUBLISH_WALLET=your-wallet-private-key \
  parallelpedia:latest
```

### Frontend Environment Variables

```bash
docker run -d \
  --name parallelpedia \
  -p 5173:5173 -p 8000:8000 -p 9200:9200 -p 8081:8081 \
  -e VITE_API_URL=http://localhost:8000 \
  parallelpedia:latest
```

## Viewing Logs

### View all logs
```bash
docker logs -f parallelpedia
```

### View individual service logs (inside container)
```bash
docker exec parallelpedia tail -f /var/log/dkg-node.log
docker exec parallelpedia tail -f /var/log/backend.log
docker exec parallelpedia tail -f /var/log/frontend.log
```

## Using Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  parallelpedia:
    build: .
    container_name: parallelpedia
    ports:
      - "5173:5173"
      - "8000:8000"
      - "9200:9200"
      - "8081:8081"
    environment:
      - DKG_BASE_URL=http://localhost:9200
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DKG_OTNODE_URL=${DKG_OTNODE_URL}
      - DKG_PUBLISH_WALLET=${DKG_PUBLISH_WALLET}
      - VITE_API_URL=http://localhost:8000
    volumes:
      # Optional: Persist DKG node database
      - dkg-data:/app/dkg-node/apps/agent/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  dkg-data:
```

Then run:
```bash
docker-compose up -d
```

## Troubleshooting

### Container won't start

1. Check logs: `docker logs parallelpedia`
2. Verify ports are not in use: `lsof -i :5173 -i :8000 -i :9200`
3. Check if services are ready: `docker exec parallelpedia curl http://localhost:8000/api/health`

### Services not accessible

1. Make sure ports are properly mapped: `docker ps` should show port mappings
2. Check firewall settings
3. Verify services are running inside container: `docker exec parallelpedia ps aux`

### DKG Node setup issues

The DKG node will automatically run setup on first start. If you need to reset:

```bash
docker exec parallelpedia rm /app/dkg-node/apps/agent/dkg.db
docker restart parallelpedia
```

## Stopping the Container

```bash
docker stop parallelpedia
docker rm parallelpedia
```

Or with docker-compose:
```bash
docker-compose down
```

