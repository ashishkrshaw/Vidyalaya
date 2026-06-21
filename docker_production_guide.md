# 🐳 Vidyalaya - Production Docker Deployment Guide

This guide walks you through deploying the Dockerized Vidyalaya application on a production server (VPS) like DigitalOcean, Linode, AWS EC2, or GCP.

---

## 🛠️ Step 1: Prepare Your Cloud Server (VPS)
1. Rent an Ubuntu Server (Ubuntu 22.04 LTS is recommended, min 2GB RAM).
2. SSH into your server:
   ```bash
   ssh root@your_server_ip
   ```
3. Install Docker on the server:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   ```
4. Start and enable Docker:
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

---

## 📁 Step 2: Clone Code & Configure Production Variables
1. Clone your project code:
   ```bash
   git clone https://github.com/your-username/Vidyalaya.git
   cd Vidyalaya
   ```
2. Create/Edit your production environment variables.
   Modify the `docker-compose.yml` to use secure, non-default passwords:
   * Change `JWT_SECRET` to a long, secure random string.
   * Use a secure MongoDB connection (either using MongoDB Atlas or local container volume).

---

## 🔒 Step 3: Configure Reverse Proxy (Nginx) & SSL (HTTPS)
In production, you should never expose raw ports (`3000` / `8000`) directly. Use a reverse proxy like **Nginx** with **Certbot** for automatic free SSL.

1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. Create an Nginx config file for your domain:
   ```bash
   sudo nano /etc/nginx/sites-available/vidyalaya
   ```
3. Paste the following configuration (replace `yourdomain.com` with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       # Backend API redirection
       location /api {
           proxy_pass http://localhost:8000/api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
4. Enable the config and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vidyalaya /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
5. Install Certbot for SSL (HTTPS):
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
   *(Select option to automatically redirect HTTP traffic to HTTPS)*

---

## 🚀 Step 4: Run the Application
Start the containers in detached (background) mode:
```bash
docker-compose up -d --build
```
Your app is now live and secured with HTTPS at `https://yourdomain.com`!

---

## 🧹 Maintenance Commands
* **View Logs**: `docker-compose logs -f`
* **Restart Services**: `docker-compose restart`
* **Stop Container Services**: `docker-compose down`
* **Update Code & Rebuild**:
  ```bash
  git pull origin main
  docker-compose up -d --build
  ```
