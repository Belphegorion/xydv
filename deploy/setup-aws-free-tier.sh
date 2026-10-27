#!/usr/bin/env bash
# ==============================================================================
# XYDV E-COMMERCE PLATFORM — AWS FREE TIER PROVISIONING SCRIPT
# Target OS: Ubuntu 24.04 LTS (Amazon EC2 t2.micro / t3.micro / t4g.small)
# ==============================================================================
set -euo pipefail

echo "===================================================================="
echo " Starting XYDV AWS Free Tier Server Setup"
echo "===================================================================="

# 1. Update OS packages
echo "--> Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw build-essential software-properties-common

# 2. Configure 4 GB Swap File (Essential for 1 GB RAM EC2 instances)
echo "--> Configuring 4 GB swap memory to protect build and runtime..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo "    4 GB Swap allocated and enabled successfully."
else
    echo "    /swapfile already exists. Skipping."
fi

# 3. Install Node.js 22 LTS
echo "--> Installing Node.js 22 LTS..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "    Node.js installed: $(node -v), npm: $(npm -v)"
else
    echo "    Node.js is already installed: $(node -v)"
fi

# 4. Install Global Production Tools (PM2)
echo "--> Installing PM2 globally..."
sudo npm install -g pm2
pm2 startup systemd -u "$USER" --hp "$HOME" | grep 'sudo' | bash || true

# 5. Install & Configure Nginx and Certbot
echo "--> Installing Nginx and Certbot for SSL..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 6. Configure UFW Firewall (SSH, HTTP, HTTPS)
echo "--> Hardening UFW firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo "    Firewall status:"
sudo ufw status verbose

# 7. Setup Web and Upload Directories
echo "--> Creating upload directories..."
sudo mkdir -p /var/www/certbot
sudo chown -R "$USER:$USER" /var/www/certbot

echo "===================================================================="
echo " Server setup complete! Next steps:"
echo " 1. Clone repository to /home/$USER/project-v1"
echo " 2. Configure .env in apps/api and apps/web"
echo " 3. Copy deploy/nginx/nginx.conf to /etc/nginx/sites-available/xydv"
echo " 4. Run 'sudo ln -s /etc/nginx/sites-available/xydv /etc/nginx/sites-enabled/'"
echo " 5. Run 'sudo certbot --nginx' to enable free HTTPS"
echo " 6. Run 'pm2 start ecosystem.config.cjs --env production'"
echo "===================================================================="
