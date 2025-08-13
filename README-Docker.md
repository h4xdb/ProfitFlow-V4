# Docker Deployment Guide - Masjid ERP System

## Quick Start

### Windows Users:
1. Double-click `run-docker.bat`
2. Wait for containers to start
3. Access the application at http://localhost:3000

### Linux/Mac Users:
1. Run `./run-docker.sh` in terminal
2. Wait for containers to start  
3. Access the application at http://localhost:3000

## Prerequisites

- Docker Desktop installed and running
- Docker Compose available
- At least 2GB free RAM
- Ports 3000 and 5432 available

## Default Login Credentials

⚠️ **IMPORTANT**: Change these passwords after first login!

- **Admin**: username=`admin`, password=`admin123`
- **Manager**: username=`manager1`, password=`manager123`
- **Cash Collector 1**: username=`collector1`, password=`collector123`
- **Cash Collector 2**: username=`collector2`, password=`collector456`

## Manual Docker Commands

### Start the application:
```bash
docker-compose up --build -d
```

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Restart just the app (keeping database):
```bash
docker-compose restart app
```

### Complete cleanup (removes all data):
```bash
docker-compose down -v
docker system prune -f
```

## Services

- **Web Application**: http://localhost:3000
- **PostgreSQL Database**: localhost:5432
- **Database Name**: masjid_erp
- **Database User**: masjid_user

## Data Persistence

- Database data is stored in `postgres_data` volume
- Application data is stored in `app_data` volume
- Data persists between container restarts
- To reset all data, run: `docker-compose down -v`

## Production Security

1. **Change default passwords** immediately after first login
2. **Update JWT_SECRET** in `.env.docker`
3. **Change database password** in `docker-compose.yml` and `.env.docker`
4. **Use HTTPS** in production (configure reverse proxy)
5. **Regular backups** of the database volume

## Troubleshooting

### Container won't start:
- Check if ports 3000 and 5432 are free
- Ensure Docker Desktop is running
- Check logs: `docker-compose logs`

### Database connection errors:
- Wait 30 seconds for database to initialize
- Check database container: `docker-compose ps`
- Verify environment variables in `.env.docker`

### Permission errors:
- On Linux/Mac: `sudo docker-compose up`
- Ensure Docker user has proper permissions

### Reset everything:
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build -d
```

## Development vs Production

This Docker setup is configured for **production deployment**. For development:
- Use `npm run dev` instead of Docker
- Database runs locally via Replit environment
- Hot reloading and faster development cycle

## Backup & Restore

### Database Backup:
```bash
docker exec masjid-erp-postgres-1 pg_dump -U masjid_user masjid_erp > backup.sql
```

### Database Restore:
```bash
docker exec -i masjid-erp-postgres-1 psql -U masjid_user masjid_erp < backup.sql
```