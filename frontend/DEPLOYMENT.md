# Deployment Guide - Student Housing Platform

## 🚀 Overview

The Student Housing Platform is production-ready and can be deployed to various hosting platforms. This guide covers multiple deployment options.

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] Backend API is deployed and accessible
- [ ] Environment variables are configured
- [ ] Database migrations are applied
- [ ] SSL/HTTPS is enabled
- [ ] CORS is properly configured on backend
- [ ] All secrets are stored in secure environment variables
- [ ] Performance testing is complete
- [ ] Security headers are configured
- [ ] Monitoring and logging are set up

## 🌐 Deployment Options

### 1. Vercel (Recommended)

**Why Vercel?**
- Built by Next.js creators
- One-click deployment
- Automatic HTTPS
- Global CDN
- Serverless functions support
- Free tier available

**Steps:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Follow prompts to connect Git repository
# 5. Configure environment variables in Vercel dashboard
# 6. Deployment complete!
```

**Post-Deployment:**
- Add `NEXT_PUBLIC_API_URL` in Vercel dashboard → Settings → Environment Variables
- Set production API endpoint
- Test all features in production

### 2. Self-Hosted (Node.js)

**Requirements:**
- Node.js 18+ server
- PM2 or similar process manager
- Nginx as reverse proxy (optional)
- SSL certificate

**Steps:**

```bash
# 1. Clone repository
git clone <your-repo> student-housing
cd student-housing

# 2. Install dependencies
pnpm install

# 3. Build production bundle
pnpm build

# 4. Create ecosystem config for PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'student-housing',
    script: 'npm start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://your-api.com'
    }
  }]
};
EOF

# 5. Start with PM2
pm2 start ecosystem.config.js

# 6. Set up Nginx reverse proxy (see below)
# 7. Configure SSL with Let's Encrypt
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --prod

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
    restart: unless-stopped
```

**Deploy Docker:**

```bash
# Build image
docker build -t student-housing .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  student-housing

# Or use Docker Compose
docker-compose up -d
```

### 4. AWS (EC2 + CloudFront)

**Steps:**

1. **EC2 Setup:**
```bash
# Launch Ubuntu 20.04 EC2 instance
# Connect via SSH

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone and deploy (see Self-Hosted section)
```

2. **CloudFront:**
- Create CloudFront distribution
- Set origin to EC2 instance
- Enable caching
- Configure SSL

3. **Environment Variables:**
```bash
export NEXT_PUBLIC_API_URL=https://api.example.com
```

### 5. Digital Ocean App Platform

**Steps:**

1. Connect GitHub repository
2. Create app
3. Configure build command: `pnpm build`
4. Configure start command: `pnpm start`
5. Add environment variables
6. Deploy

## 🔒 Security Configuration

### Environment Variables

Create `.env.production` (or configure in hosting platform):

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Security Headers

Add to `next.config.mjs`:

```javascript
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### CORS Configuration

Backend should accept requests from production domain:

```
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📊 Monitoring & Logging

### Application Monitoring

**Vercel:**
- Built-in analytics
- Performance monitoring
- Error tracking

**Self-Hosted:**

```bash
# Install PM2+ monitoring
pm2 install pm2-auto-pull

# View logs
pm2 logs student-housing

# Monitor metrics
pm2 monit
```

### Error Tracking

Consider adding Sentry for error monitoring:

```bash
pnpm add @sentry/nextjs
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install -g pnpm && pnpm install
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 🚀 Performance Optimization

### Build Optimization

```bash
# Analyze bundle
npm install -g next-bundle-analyzer

# Build with analysis
ANALYZE=true pnpm build
```

### Caching Strategy

- **Static Assets**: 1 year cache
- **Pages**: 24-hour cache
- **API Responses**: 5-minute cache

### Image Optimization

The app can use Next.js Image component for optimization:

```jsx
import Image from 'next/image';

<Image
  src="/property.jpg"
  alt="Property"
  width={400}
  height={300}
  quality={75}
  priority={false}
/>
```

## 📈 Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

## 🔐 SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal (already configured)
```

### Commercial SSL

- Purchase from Certificate Authority
- Configure in Nginx or hosting platform
- Set up auto-renewal

## 📱 Domain Configuration

1. **Register Domain** (GoDaddy, Namecheap, etc.)
2. **Configure DNS:**
   - **A Record**: Points to server IP or Vercel IP
   - **CNAME Record**: (if using Vercel)
3. **Wait for propagation** (15-30 minutes)
4. **Test with browser**: https://yourdomain.com

## ✅ Post-Deployment Testing

After deploying, test:

- [ ] Homepage loads
- [ ] Authentication works (register/login)
- [ ] Can search properties
- [ ] Can view property details
- [ ] Can contact landlord
- [ ] Can create listings (as landlord)
- [ ] API calls complete successfully
- [ ] No 404 errors in console
- [ ] HTTPS works
- [ ] Redirects work (http → https)

## 🆘 Troubleshooting

### "502 Bad Gateway" Error

**Causes:**
- Backend API not accessible
- Environment variables not set
- Application crashed

**Solutions:**
```bash
# Check app status
pm2 status

# View logs
pm2 logs

# Restart app
pm2 restart all
```

### "CORS" Error

**Solution:**
- Check backend CORS configuration
- Verify API URL in `.env.local`
- Check browser console for exact error

### Slow Performance

**Solutions:**
- Check server resources (CPU, memory)
- Enable caching headers
- Use CDN for static assets
- Optimize images
- Consider upgrading server

## 📞 Support

For deployment help:
- Check official Next.js docs: https://nextjs.org/docs/deployment
- Vercel docs: https://vercel.com/docs
- GitHub Issues: Check for similar problems

---

**Deployment is complete! Your Student Housing Platform is live! 🎉**
