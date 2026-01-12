#!/bin/bash

# Vidyalaya Backend - Auto Deployment Script
# Supports: Ubuntu, Debian, Amazon Linux 2023

set -e # Exit on error

echo "🚀 Starting Vidyalaya Backend Deployment..."

# --- 1. Install Docker if not present ---
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
    fi

    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose-plugin
    elif [[ "$OS" == *"Amazon Linux"* ]] || [[ "$OS" == *"CentOS"* ]]; then
        sudo yum update -y
        sudo yum install -y docker
        sudo service docker start
        # Install Docker Compose plugin manually if needed or assume usually included in modern Amazon Linux 2023 via 'docker-compose-plugin' or pip
        # Simplest way for Amazon Linux:
        sudo yum install -y docker-compose-plugin || echo "⚠️  Could not install docker-compose-plugin via yum, attempting fallback..."
    else
        echo "❌ Unsupported OS for auto-install. Please install Docker manually."
        exit 1
    fi
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group (avoids sudo requirement next time)
    sudo usermod -aG docker $USER || true
    echo "✅ Docker installed."
else
    echo "✅ Docker is already installed."
fi

# --- 2. Create Project Directory ---
mkdir -p vidyalaya-backend
cd vidyalaya-backend

echo "📂 Working directory: $(pwd)"

# --- 3. Generate docker-compose.yml ---
echo "📝 Generating docker-compose.yml..."
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  api:
    image: ashishkrshaw/vidyalaya-backend:latest
    container_name: vidyalaya_backend
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

# --- 4. Setup .env Configuration ---
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env template..."
    
    cat <<EOF > .env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/vidyalaya

# Security
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
DEVELOPER_SECRET=admin-secret-key-change-this

# Razorpay (Payments) - Required for Fee Collection
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Twilio / WhatsApp (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# MFA / Passkeys (CRITICAL FOR PRODUCTION)
# Set these to your actual domain (e.g. vidyalaya.com)
RP_ID=localhost
RP_NAME=Vidyalaya
ORIGIN=http://localhost:5173
EOF
    
    echo "========================================================"
    echo "🛑 ACTION REQUIRED: You must edit the .env file now!"
    echo "   Run: nano vidyalaya-backend/.env"
    echo "   Then run this script again or 'docker compose up -d'"
    echo "========================================================"
    exit 0
fi

# --- 5. Pull and Start ---
echo "⬇️  Pulling latest image..."
sudo docker compose pull

echo "🚀 Starting backend..."
sudo docker compose up -d

echo "✅ Deployment Complete!"
echo "   Server running on port 8000"
echo "   Check logs: docker compose logs -f"
