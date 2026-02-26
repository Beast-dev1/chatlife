# Backend deployment (Contabo CentOS, Docker, Nginx)

Deploy the Chatlife backend on a Contabo CentOS server over SSH (host alias `zypsie`) using Docker and Nginx.

## Architecture

- **Nginx** (container): reverse proxy on ports 80/443 → backend:4000 (Socket.io supported).
- **Backend** (container): Node/Express, Prisma, Socket.io; connects to Postgres and Redis.
- **Postgres & Redis** (containers): no ports published to host in production.

## 1. Server prerequisites (Contabo CentOS)

SSH into the server (e.g. `ssh zypsie`) and run:

```bash
# Update system (CentOS 7: yum, CentOS 8+: dnf)
sudo yum update -y

# Docker: add repo and install (CentOS 7 example)
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker

# Docker Compose v2 plugin
sudo yum install -y docker-compose-plugin
# Verify: docker compose version

# Firewall: allow HTTP, HTTPS, SSH
sudo firewall-cmd --permanent --add-service={http,https,ssh}
sudo firewall-cmd --reload
```

Optional: add your user to the `docker` group so you don’t need `sudo` for Docker:

```bash
sudo usermod -aG docker $USER
# Log out and back in for it to take effect
```

## 2. One-time setup on the server

```bash
ssh zypsie
cd /path/to/your/app   # e.g. /home/user/chatlife or /var/www/chatlife
git clone <your-repo-url> chatlife && cd chatlife
```

Create the production `.env` at the **repo root** (not inside `backend/`):

```bash
cp deploy/.env.example .env
# Edit .env and set at least:
#   POSTGRES_PASSWORD, JWT_SECRET, REFRESH_TOKEN_SECRET, FRONTEND_URL
nano .env   # or vim
```

Do not commit `.env`; it should stay only on the server.

## 3. Deploy / update (SSH zypsie)

From your **local machine** (replace `/path/to/chatlife` with the real path on the server):

```bash
ssh zypsie "cd /path/to/chatlife && git pull && docker compose -f docker-compose.prod.yml build --no-cache backend && docker compose -f docker-compose.prod.yml up -d"
```

Or SSH in and run the same commands:

```bash
ssh zypsie
cd /path/to/chatlife
git pull
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
```

First run will start Postgres, Redis, backend (runs Prisma migrations), and Nginx. API is available at `http://<server-ip>/` (and `/socket.io/` for WebSockets).

## 4. Useful commands on the server

```bash
# Logs (follow)
docker compose -f docker-compose.prod.yml logs -f backend

# Logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Restart backend only
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down
```

## 5. SSL (HTTPS) with Let’s Encrypt

When Nginx runs in Docker, you can either use a certbot container or certbot on the host.

**Option A – Certbot on the host**

1. Install certbot (e.g. `sudo yum install certbot python3-certbot-nginx` if available, or use snap).
2. Stop the nginx container:  
   `docker compose -f docker-compose.prod.yml stop nginx`
3. Run certbot in standalone or use a temporary nginx to get certs, then copy certs into a directory that you will mount into the nginx container (e.g. `./deploy/certs`).
4. In `deploy/nginx/conf.d/default.conf`, add a `listen 443 ssl` server block and set `ssl_certificate` and `ssl_certificate_key` to the paths inside the container where you mount those certs.
5. Mount the cert directory in `docker-compose.prod.yml` for the nginx service, e.g.  
   `- ./deploy/certs:/etc/letsencrypt:ro`
6. Start nginx again:  
   `docker compose -f docker-compose.prod.yml start nginx`

**Option B – Certbot in Docker**

Use a certbot container and a shared volume for certs; point Nginx in the same compose at that volume for `ssl_certificate` / `ssl_certificate_key`. Renew with a cron job or a small script that runs the certbot container.

After SSL is in place, uncomment the HTTP→HTTPS redirect in `deploy/nginx/conf.d/default.conf` so all HTTP traffic is redirected to HTTPS.

## 6. Environment variables (production)

See `deploy/.env.example`. Required in `.env` at repo root:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` – used by Postgres and by the backend’s `DATABASE_URL` (compose overrides `DATABASE_URL`/`REDIS_URL` to use service names).
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET` – backend auth.
- `FRONTEND_URL` – CORS and Socket.io origin (your real frontend URL).

Optional: Google OAuth, SMTP, `UPLOAD_DIR`, `API_URL` (see `backend/.env.example`). Add them to the same `.env` if you use those features.

## 7. Security checklist

- Use strong random values for `POSTGRES_PASSWORD`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`.
- Keep `.env` only on the server and out of git.
- Postgres and Redis are not exposed to the host; only Nginx (80/443) is public.
- After enabling SSL, redirect HTTP → HTTPS in Nginx.
- Keep the system and Docker updated (`yum update`, image rebuilds).
