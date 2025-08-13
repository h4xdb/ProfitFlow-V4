#!/bin/bash

echo "===================================="
echo "     Masjid ERP System - Docker"
echo "===================================="
echo ""
echo "Starting Docker containers..."
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo "Please install Docker and Docker Compose first."
    echo ""
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker daemon first."
    echo ""
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed!"
    echo "Please install Docker Compose first."
    echo ""
    exit 1
fi

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down

# Build and start containers
echo "Building and starting containers..."
docker-compose up --build -d

# Wait for containers to start
echo "Waiting for containers to start..."
sleep 10

# Check if containers are running
docker-compose ps

echo ""
echo "===================================="
echo "   Application is starting up..."
echo "===================================="
echo ""
echo "Web Application: http://localhost:5000"
echo "Database: PostgreSQL on localhost:5432"
echo ""
echo "Default Login Credentials:"
echo "- Admin: username='admin', password='admin123'"
echo "- Manager: username='manager1', password='manager123'"
echo "- Cash Collector 1: username='collector1', password='collector123'"
echo "- Cash Collector 2: username='collector2', password='collector456'"
echo ""
echo "WARNING: Change these default passwords after first login!"
echo ""
echo "To stop the application: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
echo "Press Ctrl+C to exit"
echo ""

# Keep the script running to show logs
docker-compose logs -f