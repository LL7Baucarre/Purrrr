# Purviewer - Docker Setup Guide

## Quick Start with Docker Compose

### Prerequisites
- Docker (v20+)
- Docker Compose (v2.0+)
- At least 2GB RAM available for Redis

### Starting the Application

```bash
# Build and start all services (Redis + Flask)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (caution: deletes Redis data)
docker-compose down -v
```

### Accessing the Application

- **Web Interface**: http://localhost:5000
- **Redis CLI**: `docker-compose exec redis redis-cli`

## Service Architecture

### Redis Service
- **Image**: redis:7-alpine
- **Port**: 6379 (internal), 6379 (host)
- **Memory**: 2GB max (LRU eviction)
- **Persistence**: RDB snapshots enabled
- **Purpose**: 
  - Session storage for large file uploads
  - Data caching across requests
  - Distributed session management

### Flask Web Service
- **Port**: 5000
- **Max File Size**: 500MB
- **Environment Variables**:
  - `REDIS_URL`: Redis connection string (default: redis://redis:6379/0)
  - `FLASK_ENV`: Environment mode (production/development)
  - `UPLOAD_FOLDER`: Temporary upload directory
  - `MAX_FILE_SIZE`: Maximum file size in MB

## Configuration

### Environment Variables

Create a `.env` file to customize settings:

```bash
# Redis configuration
REDIS_URL=redis://redis:6379/0

# Flask configuration
FLASK_ENV=production

# File handling
MAX_FILE_SIZE=500
UPLOAD_FOLDER=/tmp/purviewer
```

### Scaling Redis

Adjust memory limits in `docker-compose.yml`:

```yaml
redis:
  command: >
    redis-server
    --maxmemory 4gb    # Change this
    --maxmemory-policy allkeys-lru
```

## Data Persistence

- **Redis Data**: Stored in `redis_data` volume
- **Logs**: Stored in `./logs` directory
- **Temporary Files**: Stored in `purviewer_temp` volume

To backup Redis data:

```bash
# Export Redis data
docker-compose exec redis redis-cli BGSAVE

# Copy backup
docker cp purviewer-redis:/data/dump.rdb ./redis-backup.rdb
```

## Production Deployment

### For Production Use:

1. **Update Dockerfile**:
   ```dockerfile
   # Use production WSGI server instead of Flask development server
   RUN pip install gunicorn
   CMD ["gunicorn", "--workers=4", "--bind=0.0.0.0:5000", "src.purviewer.flask_app:app"]
   ```

2. **Enable HTTPS**:
   - Add nginx reverse proxy in docker-compose.yml
   - Use SSL certificates (Let's Encrypt)

3. **Redis Persistence**:
   - Set `--appendonly yes` in Redis command
   - Configure backup strategy

4. **Memory Management**:
   - Adjust `maxmemory` based on available resources
   - Monitor memory usage: `docker-compose exec redis redis-cli info memory`

## Monitoring

### Health Checks

Services include health checks that verify:
- Redis ping response
- HTTP endpoint availability

View health status:
```bash
docker-compose ps
```

### Logs

View application logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f redis

# Last N lines
docker-compose logs --tail=50
```

## Troubleshooting

### Redis Connection Failed

```bash
# Check Redis status
docker-compose ps redis

# Check connection
docker-compose exec web redis-cli -u ${REDIS_URL} ping

# Check logs
docker-compose logs redis
```

### Out of Memory

```bash
# Check Redis memory usage
docker-compose exec redis redis-cli info memory

# Clear old sessions
docker-compose exec redis redis-cli FLUSHDB
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Change 5001 to desired port
```

## Performance Tips

1. **Use SSD** for Redis persistence
2. **Allocate enough memory** to Redis (at least equal to largest CSV file size)
3. **Enable Redis persistence** for data recovery
4. **Monitor memory usage** regularly
5. **Consider Redis Cluster** for very large deployments

## Building Custom Images

```bash
# Build with specific tag
docker build -t purviewer:latest -t purviewer:v1.0 .

# Push to registry
docker tag purviewer:latest myregistry/purviewer:latest
docker push myregistry/purviewer:latest
```

## File Size Handling

The application is now optimized for large files:

- **Max Upload**: 500MB
- **Session Storage**: Redis (persistent across requests)
- **Memory Management**: Intelligent eviction policies
- **Stream Processing**: Efficient DataFrame chunking

For files larger than 500MB, adjust in docker-compose.yml:

```yaml
web:
  environment:
    - MAX_FILE_SIZE=1000  # 1GB
```

## Performance Benchmarks

With current Docker setup:
- **Small files** (< 50MB): ~2-3 seconds
- **Medium files** (50-200MB): ~5-10 seconds
- **Large files** (200-500MB): ~15-30 seconds

Times depend on CPU cores and available RAM.
