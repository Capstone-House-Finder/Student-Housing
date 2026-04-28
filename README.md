# Student Housing Platform 🚀

A full-stack house rental management system built with Next.js 16, Express.js, and MySQL (now configured for Aiven database services).

## 🗄️ Database Configuration

### Aiven Integration
- This project uses **Aiven MySQL** for managed database services
- All database connection details are configured in `.env` environment file
- The critical endpoint is defined by `DATABASE_URL`:

```env
# Aiven Database Connection
DATABASE_URL=aiven://<username>:<password>@<host>:<port>/<database-name>
```

### Database Components
| Component | Aiven Service Name | Required Value |
|---------|-------------------|----------------|
| Host | `<project-name>.aivencloud.com` | Your Aiven service hostname |
| Port | `12345` (standard) | Port number (usually 12345 for Aiven) |
| Database | `<database-name>` | Your database name |
| Username | `appuser` | Standard Aiven username |
| Password | `<custom-password>` | Your Aiven service password |

## 🛠️ Setup Instructions

### 1. Obtain Aiven Credentials
1. Create an Aiven account at [aiven.io](https://aiven.io)
2. Create a MySQL database service:
   - Choose region (closest to your application servers)
   - Select plan size and scaling options
   - Configure backup and retention policies
   - Note your service name (e.g., `wado-housing-api`)

### 2. Configure Environment
1. Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Aiven credentials:
   ```env
   DATABASE_URL=aiven://appuser:YOUR_PASSWORD@mysql-YOUR-AIVEN-SERVICE.NAME.aivencloud.com:12345/STUDENT_HOUSING
   ```

### 3. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## 🚀 Deployment Workflow

### GitHub Integration
1. After cloning the repo:
   ```bash
   git clone https://github.com/Capstone-House-Finder/Student-Housing.git
   ```
2. Create a new branch for feature work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Loading Local Secrets
- Use `server-run.js` to load security credentials at startup.

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Template with all required variables |
| `.env` | Secret configuration (never commit) |
| `.env.example` | Contains placeholders with value descriptions |

## 🔒 Security Practices

- **Never commit `.env` file** - It contains sensitive credentials
- All database credentials are loaded at runtime via environment variables
- Service tokens are stored in `settings.local.json` with restricted access

## 🐳 Docker Usage

### For Staging Environment
```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml build
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production Deployment
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- [Frontend Workflow](frontend.md)
- [Backend API Reference](backend_api.md) 
- [Database Schema](mysql/init/01_schema.sql)
- [Testing Guide](TESTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Submit a Pull Request
4. Ensure all tests pass (`npm test -- --watch`)
5. Follow the [Contribution Guidelines](CONTRIBUTING.md)
