# XYDV E-Commerce Platform — AWS Free Tier ($0/month) Master Deployment Guide

This guide provides a comprehensive, end-to-end operational walkthrough to deploy the complete XYDV e-commerce platform (**Next.js 15 Storefront + Admin Portal**, **Express API**, **MongoDB Atlas**, **Razorpay Webhooks**) on **Amazon Web Services (AWS) for 100% FREE ($0.00 / ₹0.00 per month)**.

---

## 1. Zero-Cost System Architecture

```
                             [ Customer / Admin Browser ]
                                          │
                                          │ HTTPS (Port 443)
                                          ▼
                             [ AWS Elastic IP (Static IPv4) ]
                                          │
   ┌──────────────────────────────────────┴──────────────────────────────────────┐
   │                  AWS EC2 Instance (Ubuntu 24.04 LTS)                        │
   │           Instance Type: t2.micro or t3.micro (1 vCPU, 1 GB RAM)            │
   │               EBS Storage: 25 GB gp3 SSD + 4 GB Virtual Swap                │
   │                                                                             │
   │  ┌───────────────────────────────────────────────────────────────────────┐  │
   │  │             Nginx Reverse Proxy + Let's Encrypt Free SSL              │  │
   │  │               (client_max_body_size 15M, Gzip, Caching)               │  │
   │  └──────────────────┬─────────────────────────────────┬──────────────────┘  │
   │                     │                                 │                     │
   │                     │ proxy /api/ & /uploads/         │ proxy /             │
   │                     ▼                                 ▼                     │
   │  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
   │  │       Express 5 REST API            │  │   Next.js 15 App Router      │  │
   │  │  (PM2: xydv-api on Port 5000)       │  │ (PM2: xydv-web on Port 3000) │  │
   │  │  Memory limit: 256M max-old-space   │  │ Memory limit: 384M old-space │  │
   │  └──────────────────┬──────────────────┘  └──────────────────────────────┘  │
   │                     │                                                       │
   └─────────────────────┼───────────────────────────────────────────────────────┘
                         │ TLS encrypted connection (Port 27017)
                         ▼
        ┌─────────────────────────────────────────────────┐
        │        MongoDB Atlas M0 Free Sandbox            │
        │        Hosted in AWS Mumbai (ap-south-1)        │
        │      512 MB Storage, Daily Automated Backup     │
        └─────────────────────────────────────────────────┘
```

---

## 2. Monthly Cost Breakdown ($0.00 / ₹0.00 Guaranteed)

AWS Free Tier includes the following monthly allowances for 12 months from account creation:

| Resource | Free Tier Allowance | How XYDV Uses It | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** (`t2.micro` or `t3.micro`) | **750 hours / month** | 1 instance running 24/7/365 (~744 hours/mo) | **$0.00** |
| **Public IPv4 Address** | **750 hours / month** | 1 Elastic IP attached to the running instance | **$0.00** |
| **Amazon EBS Storage** (gp3 SSD) | **30 GB / month** | 25 GB root OS & application storage | **$0.00** |
| **Outbound Data Transfer** | **100 GB / month** | Storefront page visits and asset delivery | **$0.00** |
| **MongoDB Atlas** (M0 Cluster) | **512 MB forever** | Products, orders, customers, reviews | **$0.00** |
| **Cloudinary** (Free Tier) | **25 Credits (~25 GB) forever**| Product and variant lookbook images | **$0.00** |
| **SSL Certificate** (Certbot) | **Unlimited renewals** | Automated Let's Encrypt TLS encryption | **$0.00** |
| **TOTAL MONTHLY EXPENSE** | | | **$0.00 / ₹0.00** |

---

## 3. Step-by-Step AWS Setup Walkthrough

### Step 1: Launch the EC2 Instance (AWS Console)
1. Sign in to the **AWS Management Console** and select your nearest region (e.g., **Asia Pacific (Mumbai) `ap-south-1`**).
2. Go to **EC2** → click **Launch Instance**.
3. Configure the following settings:
   * **Name:** `xydv-production-server`
   * **Application and OS Image:** `Ubuntu Server 24.04 LTS (HVM), SSD Volume Type` (64-bit x86 or ARM)
   * **Instance Type:** `t2.micro` (or `t3.micro` if in a region where t3 is the free tier default)
   * **Key Pair:** Create a new key pair (e.g., `xydv-aws-key.pem`) and download it to your local machine.
   * **Network Settings (Security Group):**
     * Check **Allow SSH traffic from anywhere** (Port 22)
     * Check **Allow HTTP traffic from the internet** (Port 80)
     * Check **Allow HTTPS traffic from the internet** (Port 443)
   * **Configure Storage:** Change the root volume size to **25 GiB** of `gp3` (General Purpose SSD).
4. Click **Launch Instance**.

---

### Step 2: Allocate & Associate an Elastic IP (Free Static IP)
> [!IMPORTANT]
> A public Elastic IP is 100% free **only while it is attached to a running EC2 instance**.
1. In the EC2 Dashboard, under **Network & Security**, click **Elastic IPs**.
2. Click **Allocate Elastic IP address** → Leave defaults (Amazon's pool of IPv4 addresses) → click **Allocate**.
3. Select the new Elastic IP, click **Actions** → **Associate Elastic IP address**.
4. Choose **Instance**, select your `xydv-production-server`, and click **Associate**.
5. Note your Public IPv4 Address (e.g., `13.234.XX.XX`).

---

### Step 3: Connect via SSH
On your local computer (Linux, macOS, or Windows PowerShell):
```bash
# Set secure key permissions (Linux/macOS)
chmod 400 xydv-aws-key.pem

# SSH into your EC2 server
ssh -i "xydv-aws-key.pem" ubuntu@<YOUR_ELASTIC_IP>
```

---

### Step 4: Run the Automated Provisioning Script
Once connected to the server, run the bootstrap script:
```bash
# Clone the repository
git clone https://github.com/your-username/project-v1.git
cd project-v1

# Make the setup script executable and run it
chmod +x deploy/setup-aws-free-tier.sh deploy/deploy.sh
./deploy/setup-aws-free-tier.sh
```

**What this script automatically does:**
1. Configures a **4 GB swap file** on EBS so `next build` and Node.js never run out of memory.
2. Installs **Node.js 22 LTS**, **Nginx**, **Certbot**, and **PM2**.
3. Hardens the **UFW firewall** (opens 22, 80, 443; blocks all other ports).
4. Configures PM2 systemd auto-revive hooks so the site restarts automatically on server reboots.

---

### Step 5: Configure Production Environment Variables

#### 1. Backend Environment (`apps/api/.env`)
Create or edit `apps/api/.env`:
```bash
nano apps/api/.env
```
Paste your production values:
```env
PORT=5000
NODE_ENV=production

# MongoDB Atlas URI (Free M0 Cluster)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.XXXXX.mongodb.net/xydv?retryWrites=true&w=majority

# Strong Cryptographic Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=YOUR_64_CHARACTER_RANDOM_HEX_SECRET_STRING_HERE
JWT_REFRESH_SECRET=ANOTHER_64_CHARACTER_RANDOM_HEX_SECRET_STRING_HERE
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

# Storefront Client Origin
CLIENT_URL=https://yourdomain.com

# Razorpay Production or Test Keys
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_RAZORPAY_WEBHOOK_SECRET

# Cloudinary CDN Storage (Free Tier)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### 2. Frontend Environment (`apps/web/.env.local`)
Create or edit `apps/web/.env.local`:
```bash
nano apps/web/.env.local
```
Paste:
```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
```

---

### Step 6: Build the Platform & Start PM2
```bash
# Return to project root
cd ~/project-v1

# Install dependencies and build both Next.js and Express
npm install
npm run build

# Start both services under PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
```

Verify that both applications are running:
```bash
pm2 status
```
You should see:
* `xydv-api` (online, port 5000, ~70-90 MB RAM)
* `xydv-web` (online, port 3000, ~120-150 MB RAM)

---

### Step 7: Configure Nginx & Free SSL (Let's Encrypt)

1. Copy the Nginx configuration:
```bash
sudo cp deploy/nginx/nginx.conf /etc/nginx/sites-available/xydv
sudo ln -sf /etc/nginx/sites-available/xydv /etc/nginx/sites-enabled/xydv
sudo rm -f /etc/nginx/sites-enabled/default
```

2. Open the file and update `server_name` with your actual domain name:
```bash
sudo nano /etc/nginx/sites-available/xydv
```
*(Replace `xydv-performance.com` with `yourdomain.com www.yourdomain.com`)*

3. Test syntax and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. Run Certbot to generate and install free automated SSL certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Step 8: Configure Razorpay Webhooks
In your **Razorpay Dashboard**:
1. Go to **Settings** → **Webhooks** → click **Add New Webhook**.
2. Set **Webhook URL** to: `https://yourdomain.com/api/webhooks/razorpay`
3. Enter your **Secret** (matching `RAZORPAY_WEBHOOK_SECRET` in `apps/api/.env`).
4. Select the active events:
   * `payment.captured`
   * `payment.failed`
   * `order.paid`
   * `refund.processed`
5. Save the webhook.

---

## 4. Operational Runbooks

### Checking Live Logs
```bash
# View combined logs
pm2 logs

# View backend API logs only
pm2 logs xydv-api

# View frontend Next.js logs only
pm2 logs xydv-web

# View Nginx access / error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performing Zero-Downtime Updates
When you push code changes to GitHub, deploy them to the EC2 server in one command:
```bash
cd ~/project-v1
./deploy/deploy.sh
```

### Restarting the Server
```bash
# Restart both Node processes
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx
```

---

## 5. The $0 Cost Safeguards Checklist (What NOT to Do)

To guarantee your monthly AWS bill remains exactly **$0.00**, follow these rules:

1. [x] **Only 1 Running EC2 Instance**: Never launch a second EC2 instance under the same account (the 750 free hours/month will be split between them, resulting in billing for any excess hours).
2. [x] **Do NOT create an AWS Load Balancer (ALB)**: Application Load Balancers cost ~$16–$22/month. Your Nginx installation handles all SSL termination, rate limiting, and reverse proxying for free.
3. [x] **Do NOT create a NAT Gateway**: NAT Gateways cost ~$32/month.
4. [x] **Do NOT leave unattached Elastic IPs**: An Elastic IP is free **only** when associated with a running instance. If you terminate or stop the instance, release the Elastic IP immediately.
5. [x] **Keep EBS Volume <= 30 GB**: The free tier limit is 30 GB gp2/gp3. Our configuration uses 25 GB.
6. [x] **Use MongoDB Atlas M0**: Do not provision AWS DocumentDB (DocumentDB has no free tier and costs ~$50+/month).
