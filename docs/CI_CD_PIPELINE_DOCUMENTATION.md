# CI/CD Pipeline Documentation

**Project:** Student Housing Platform  
**Last Updated:** May 4, 2026

---

## Table of Contents

1. [GitHub Actions Workflows](#github-actions-workflows)
   - [Backend CI](#backend-ci)
   - [Frontend CI](#frontend-ci)
   - [Deploy](#deploy)
   - [Release Tag](#release-tag)
2. [Docker Compose Files](#docker-compose-files)
   - [Base Configuration](#base-configuration)
   - [Staging Overrides](#staging-overrides)
   - [Production Overrides](#production-overrides)

---

## GitHub Actions Workflows

All workflows use GitHub Actions to automate testing, building, and deployment. Workflows are stored in `.github/workflows/` and use YAML syntax.

---

### Backend CI

**File:** `.github/workflows/backend-ci.yml`

#### Workflow Metadata

```yaml
name: Backend CI
```
- **Purpose:** Identifies this workflow in GitHub Actions UI

#### Triggers (on)

```yaml
on:
  push:
    branches:
      - develop
      - main
      - "feature/**"
      - "release/**"
      - "hotfix/**"
    paths:
      - "backend/**"
      - "mysql/**"
      - ".github/workflows/backend-ci.yml"
```
- **When it runs:** Every push to develop, main, or any Gitflow branch
- **Smart filtering:** Only runs if changes affect backend code, database schema, or the CI file itself
- **Benefit:** Backend-only commits skip frontend CI, and vice versa—saves runner minutes

```yaml
  pull_request:
    branches:
      - develop
      - main
      - "release/**"
    paths:
      - "backend/**"
      - "mysql/**"
      - ".github/workflows/backend-ci.yml"
```
- **When it runs:** Every pull request targeting develop, main, or release branches
- **Smart filtering:** Same path filtering as push

#### Concurrency Control

```yaml
concurrency:
  group: backend-ci-${{ github.ref }}
  cancel-in-progress: true
```
- **Purpose:** Only one workflow per branch at a time
- **Behavior:** If a new commit arrives while a workflow is running, the old one is cancelled
- **Benefit:** Newer code always has priority; avoids stale test results

#### Job 1: Lint

```yaml
jobs:
  lint:
    name: Lint and type-check
    runs-on: ubuntu-latest
```
- **Purpose:** Check code quality and TypeScript types
- **OS:** Ubuntu latest (GitHub-hosted runner, most common and reliable)

```yaml
    defaults:
      run:
        working-directory: backend
```
- **Effect:** All `run` commands in this job execute inside the `backend/` directory

```yaml
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
```
- **Purpose:** Download the repository code onto the runner
- **Version:** v4 is the latest action version

```yaml
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
```
- **Purpose:** Install Node.js v20
- **`cache: npm`:** Speed up future runs by caching node_modules
- **`cache-dependency-path`:** Where to find the lock file for caching

```yaml
      - name: Install dependencies
        run: npm ci
```
- **Purpose:** Install npm packages
- **Why `npm ci` not `npm install`:** `ci` is "clean install"—reproducible, uses lock file exactly, never updates versions

```yaml
      - name: Run ESLint
        run: npm run lint
```
- **Purpose:** Check code style and common mistakes
- **Command defined in:** `backend/package.json` under scripts

```yaml
      - name: Run TypeScript type-check
        run: npm run type-check
```
- **Purpose:** Check TypeScript types for errors
- **Command defined in:** `backend/package.json` under scripts

#### Job 2: Test

```yaml
  test:
    name: Unit and integration tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
```
- **Purpose:** Run Jest unit and integration tests
- **Runs in parallel with lint job** (separate jobs = parallel execution)

```yaml
    services:
      mysql:
        image: mysql:8.0
```
- **Purpose:** Spin up a real MySQL 8.0 database container
- **Lifecycle:** Created before tests start, destroyed after tests end
- **Why a real DB:** Tests need a real database to test database interactions

```yaml
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: student_housing_test
          MYSQL_USER: appuser
          MYSQL_PASSWORD: apppassword
```
- **Purpose:** Configure the MySQL container
- **MYSQL_ROOT_PASSWORD:** Superuser password for admin access
- **MYSQL_DATABASE:** Create this database on startup (student_housing_test)
- **MYSQL_USER, MYSQL_PASSWORD:** Create this user for app access

```yaml
        ports:
          - 3306:3306
```
- **Port mapping:** Container port 3306 → host (runner) port 3306
- **Effect:** Backend tests on the runner can reach MySQL at `localhost:3306`

```yaml
        options: >-
          --health-cmd="mysqladmin ping -h localhost -u root -prootpassword"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
```
- **Purpose:** Health check configuration
- **`--health-cmd`:** Command to verify MySQL is alive (ping with root credentials)
- **`--health-interval`:** Check every 10 seconds
- **`--health-timeout`:** Wait max 5 seconds for a response
- **`--health-retries`:** Try 5 times before giving up
- **Effect:** Backend job waits for MySQL to be healthy before running tests

```yaml
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci
```
- **Same as lint job** — set up the environment

```yaml
      - name: Wait for MySQL service
        run: |
          for i in {1..30}; do
            mysqladmin ping -h 127.0.0.1 -u root -prootpassword && break
            sleep 1
          done
```
- **Purpose:** Extra safety—wait up to 30 seconds for MySQL to respond
- **Logic:** Try every 1 second; exit loop when successful (&&)
- **Redundant with health check above** but ensures robustness

```yaml
      - name: Run database schema
        env:
          MYSQL_HOST: 127.0.0.1
          MYSQL_USER: root
          MYSQL_PASSWORD: rootpassword
          MYSQL_DATABASE: student_housing_test
        run: mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < mysql/init/01_schema.sql
```
- **Purpose:** Apply the full database schema to the test database
- **Command:** Pipe the schema file into `mysql` CLI tool
- **Effect:** Database is ready with tables, indexes, and constraints before tests run

```yaml
      - name: Create .env for tests
        run: |
          cat > .env << EOF
          NODE_ENV=test
          PORT=5000
          DATABASE_URL=mysql://appuser:apppassword@127.0.0.1:3306/student_housing_test
          JWT_SECRET=test-secret-key-12345
          CLOUDINARY_CLOUD_NAME=test
          CLOUDINARY_API_KEY=test
          CLOUDINARY_API_SECRET=test
          EOF
```
- **Purpose:** Create `.env` file that Jest tests read
- **DATABASE_URL:** Points to the MySQL service container on localhost
- **Dummy Cloudinary values:** Tests mock these; real values not needed

```yaml
      - name: Run Jest tests
        run: npm test -- --ci --coverage
```
- **Purpose:** Execute Jest test suite
- **`--ci`:** CI mode—better output formatting, exits with error code if tests fail
- **`--coverage`:** Collect code coverage metrics

---

### Frontend CI

**File:** `.github/workflows/frontend-ci.yml`

#### Triggers

```yaml
on:
  push:
    branches:
      - develop
      - main
      - "feature/**"
      - "release/**"
      - "hotfix/**"
    paths:
      - "frontend/**"
      - ".github/workflows/frontend-ci.yml"

  pull_request:
    branches:
      - develop
      - main
      - "release/**"
    paths:
      - "frontend/**"
      - ".github/workflows/frontend-ci.yml"
```
- **Similar to backend** but watches frontend files only
- **No MySQL service needed** — Next.js tests are mostly unit tests

#### Concurrency

```yaml
concurrency:
  group: frontend-ci-${{ github.ref }}
  cancel-in-progress: true
```
- **Same behavior as backend** — one workflow per branch

#### Job 1: Lint

```yaml
  lint:
    name: Lint and type-check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type-check
        run: npm run type-check
```
- **Same pattern as backend** — checkout, setup Node, install, lint, type-check

#### Job 2: Test

```yaml
  test:
    name: Unit tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
```
- **Setup is identical to backend** — checkout, Node, npm install

```yaml
      - name: Run Jest
        run: npm run test -- --ci --passWithNoTests --coverage
        env:
          NEXT_PUBLIC_API_URL: http://localhost:5000
```
- **Purpose:** Run Jest tests
- **`--passWithNoTests`:** Don't fail if no tests found (helps with monorepo setups)
- **`--coverage`:** Collect coverage metrics
- **`NEXT_PUBLIC_API_URL` env:** Tells Next.js tests where the API is (localhost for testing)

```yaml
      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
        with:
          files: ./coverage/lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}
```
- **Purpose:** Send coverage report to Codecov (code quality tracking service)
- **`if` condition:** Only upload on develop and main (skip feature branches to avoid noise)
- **`${{ secrets.CODECOV_TOKEN }}`:** Secret stored in GitHub Settings

---

### Deploy

**File:** `.github/workflows/deploy.yml`

#### Triggers

```yaml
on:
  push:
    branches:
      - develop          # → staging
      - "release/**"     # → UAT / pre-production
      - main             # → production
      - "hotfix/**"      # → production (fast-track)
```
- **Only integration branches trigger deploys** — not feature/* (personal work)
- **Branch routing:** Different branches deploy to different environments

#### Concurrency

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```
- **One deploy per environment at a time**
- **Latest code always wins** — if two commits land, second deploy cancels the first

#### Job 1: Resolve Environment

```yaml
  resolve-env:
    name: Resolve target environment
    runs-on: ubuntu-latest
    outputs:
      env_name: ${{ steps.set.outputs.env_name }}

    steps:
      - name: Set environment name from branch
        id: set
        run: |
          BRANCH="${{ github.ref_name }}"

          if [[ "$BRANCH" == "develop" ]]; then
            echo "env_name=staging" >> $GITHUB_OUTPUT

          elif [[ "$BRANCH" == release/* ]]; then
            echo "env_name=uat" >> $GITHUB_OUTPUT

          elif [[ "$BRANCH" == "main" || "$BRANCH" == hotfix/* ]]; then
            echo "env_name=production" >> $GITHUB_OUTPUT

          else
            echo "env_name=none" >> $GITHUB_OUTPUT
          fi
```
- **Purpose:** Determine which environment to deploy to based on branch name
- **`outputs: env_name`:** This job outputs a value that other jobs can read
- **Logic:**
  - `develop` → staging
  - `release/*` → uat (user acceptance testing)
  - `main` → production
  - `hotfix/*` → production
- **`echo "env_name=..." >> $GITHUB_OUTPUT`:** Bash way to set job output
- **Benefit:** Keeps deploy jobs DRY (don't repeat branch logic in each deploy job)

#### Job 2: Deploy Frontend

```yaml
  deploy-frontend:
    name: Deploy frontend → ${{ needs.resolve-env.outputs.env_name }}
    runs-on: ubuntu-latest
    needs: resolve-env
    if: needs.resolve-env.outputs.env_name != 'none'
```
- **Purpose:** Deploy the Next.js frontend to the target environment
- **`needs: resolve-env`:** Wait for resolve-env job to finish first; get its outputs
- **`if` condition:** Skip deploy if environment is 'none' (e.g., unknown branch)
- **`${{ needs.resolve-env.outputs.env_name }}`:** Read output from resolve-env job—becomes part of the deploy job name

```yaml
    environment: ${{ needs.resolve-env.outputs.env_name }}
```
- **Purpose:** Link this job to a GitHub Environment (staging, uat, or production)
- **Behavior:** Production environment can require manual approval before deploy proceeds
- **Configuration:** Set up in GitHub Settings → Environments → production → "Required reviewers"

```yaml
    defaults:
      run:
        working-directory: frontend
```
- **Effect:** All commands run inside frontend/ directory

```yaml
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
```
- **Standard setup** — checkout, Node, npm install

```yaml
      - name: Build Next.js
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.API_URL }}
```
- **Purpose:** Build Next.js for production
- **`NEXT_PUBLIC_API_URL`:** Environment variable passed from GitHub environment secrets
- **`${{ vars.API_URL }}`:** GitHub's syntax for reading repository/environment variables
- **Effect:** Frontend gets the correct API URL baked into the build for each environment

```yaml
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /home/student-housing/frontend
            docker pull student-housing-frontend:latest
            docker stop student-housing-frontend || true
            docker rm student-housing-frontend || true
            docker run -d --name student-housing-frontend \
              -p 3000:3000 \
              -e NODE_ENV=production \
              --restart unless-stopped \
              student-housing-frontend:latest
```
- **Purpose:** SSH into the deployment server and run the frontend container
- **`appleboy/ssh-action`:** Community action for SSH commands
- **Secrets used:**
  - `DEPLOY_HOST` — server IP/hostname
  - `DEPLOY_USER` — SSH username
  - `DEPLOY_KEY` — SSH private key (stored securely in GitHub)
- **Script steps:**
  1. CD into frontend directory on server
  2. Pull latest Docker image from registry
  3. Stop and remove old container (|| true = don't fail if it doesn't exist)
  4. Run new container with production settings
  5. Map port 3000 inside container to port 3000 on host
  6. Set NODE_ENV=production for optimization
  7. Auto-restart on failure (--restart unless-stopped)

#### Job 3: Deploy Backend

```yaml
  deploy-backend:
    name: Deploy backend → ${{ needs.resolve-env.outputs.env_name }}
    runs-on: ubuntu-latest
    needs: resolve-env
    if: needs.resolve-env.outputs.env_name != 'none'

    environment: ${{ needs.resolve-env.outputs.env_name }}

    defaults:
      run:
        working-directory: backend

    steps:
      # Same checkout, Node.js, npm install steps
      
      - name: Build Docker image
        run: |
          docker build -t student-housing-backend:latest -f Dockerfile .
          # For staging/prod, also tag with environment
          if [[ "${{ needs.resolve-env.outputs.env_name }}" == "production" ]]; then
            docker tag student-housing-backend:latest student-housing-backend:v1.0.0
          fi
```
- **Purpose:** Build the backend Docker image
- **`docker build -t`:** Create an image with tag `student-housing-backend:latest`
- **Production tag:** Also tag as `v1.0.0` for version control

```yaml
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /home/student-housing/backend
            docker pull student-housing-backend:latest
            docker stop student-housing-api || true
            docker rm student-housing-api || true
            docker run -d --name student-housing-api \
              -p 5000:5000 \
              -e NODE_ENV=production \
              -e DATABASE_URL=${{ secrets.PROD_DATABASE_URL }} \
              -e JWT_SECRET=${{ secrets.JWT_SECRET }} \
              -e CLOUDINARY_CLOUD_NAME=${{ secrets.CLOUDINARY_CLOUD_NAME }} \
              -e CLOUDINARY_API_KEY=${{ secrets.CLOUDINARY_API_KEY }} \
              -e CLOUDINARY_API_SECRET=${{ secrets.CLOUDINARY_API_SECRET }} \
              --restart unless-stopped \
              student-housing-backend:latest
```
- **Similar pattern to frontend** but passes environment variables as secrets
- **Key difference:** DATABASE_URL points to production database (e.g., RDS, Aiven)
- **All credentials come from GitHub Secrets** — never hardcoded

#### Job 4: Health Check (Optional)

```yaml
  health-check:
    name: Verify deployment health
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend]
    if: always()

    steps:
      - name: Check frontend health
        run: |
          curl -f http://${{ secrets.DEPLOY_HOST }}:3000/health || exit 1
      
      - name: Check backend health
        run: |
          curl -f http://${{ secrets.DEPLOY_HOST }}:5000/health || exit 1
```
- **Purpose:** Verify both frontend and backend are running after deployment
- **`needs: [deploy-frontend, deploy-backend]`:** Run after both deploys finish
- **`if: always()`:** Run even if previous jobs failed (to report status)
- **`curl -f`:** Fail if HTTP status is not 2xx
- **`exit 1`:** Return error code if check fails

---

### Release Tag

**File:** `.github/workflows/release-tag.yml`

#### Triggers

```yaml
on:
  pull_request:
    branches:
      - main
    types:
      - closed
```
- **When it runs:** When a PR to main is closed
- **Note:** Fires even if PR was closed without merging; we filter for merged below

#### Job: Tag

```yaml
  tag:
    name: Create release tag
    runs-on: ubuntu-latest

    if: |
      github.event.pull_request.merged == true &&
      (
        startsWith(github.event.pull_request.head.ref, 'release/') ||
        startsWith(github.event.pull_request.head.ref, 'hotfix/')
      )
```
- **Purpose:** Create a git tag when a release PR is merged to main
- **Condition 1:** `github.event.pull_request.merged == true` — only if actually merged
- **Condition 2:** Source branch is `release/*` or `hotfix/*`
- **Effect:** Direct pushes to main (without PR) don't create tags

```yaml
    permissions:
      contents: write   # needed to push the tag
```
- **Purpose:** Grant this workflow permission to write to the repository
- **Why needed:** Creating and pushing tags requires write access

```yaml
      - name: Checkout main
        uses: actions/checkout@v4
        with:
          ref: main
          fetch-depth: 0   # full history needed for tagging
```
- **`ref: main`:** Ensure we check out main branch specifically
- **`fetch-depth: 0`:** Download full git history (not just last commit)
- **Why full history:** `git tag` needs access to all commits and branches

```yaml
      - name: Extract version from branch name
        id: version
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          # Strip the prefix (release/ or hotfix/) to get the version number
          VERSION="${BRANCH#release/}"
          VERSION="${VERSION#hotfix/}"
          echo "version=v$VERSION" >> $GITHUB_OUTPUT
          echo "Tagging as v$VERSION"
```
- **Purpose:** Extract version from branch name
- **Example:**
  - Input: `release/1.3.0` → Output: `v1.3.0`
  - Input: `hotfix/1.2.1` → Output: `v1.2.1`
- **Bash syntax:**
  - `${BRANCH#release/}` — remove `release/` prefix from beginning
  - `${BRANCH#hotfix/}` — remove `hotfix/` prefix from beginning
- **Output:** `$GITHUB_OUTPUT` makes it available as `steps.version.outputs.version`

```yaml
      - name: Create and push git tag
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag ${{ steps.version.outputs.version }} \
            -m "Release ${{ steps.version.outputs.version }} — merged from ${{ github.event.pull_request.head.ref }}"
          git push origin ${{ steps.version.outputs.version }}
```
- **Configure git:** Set author name and email for the tag
- **`git tag vX.Y.Z`:** Create tag with semantic version
- **`-m "message"`:** Tag message (appears in git log)
- **`git push origin`:** Push tag to GitHub remote
- **Effect:** Tag appears in GitHub as a release reference

```yaml
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.version.outputs.version }}
          name: "Release ${{ steps.version.outputs.version }}"
          generate_release_notes: true
```
- **Purpose:** Create a GitHub Release from the tag
- **`tag_name`:** Link release to the git tag
- **`name`:** Display name for the release (e.g., "Release v1.3.0")
- **`generate_release_notes`:** Auto-generate changelog from merged PR titles
- **Effect:** Team gets a nice release page with changelog on GitHub

---

## Docker Compose Files

Docker Compose orchestrates multiple containers (MySQL, backend API, frontend web) locally and in cloud environments.

### Base Configuration

**File:** `docker-compose.yml`

#### Service: MySQL

```yaml
services:
  mysql:
    image: mysql:8.0
```
- **`image`:** Use official MySQL 8.0 Docker image
- **Version 8.0:** Latest stable, compatible with our schema

```yaml
    container_name: student_housing_db
```
- **Purpose:** Give container a fixed name (easier to reference than auto-generated ID)

```yaml
    restart: unless-stopped
```
- **Behavior:** Automatically restart container if it crashes
- **unless-stopped:** Skip restart only if we explicitly stop it (manual intervention)
- **Use case:** Ensures database survives a temporary network issue

```yaml
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE:      ${MYSQL_DATABASE:-student_housing}
      MYSQL_USER:          ${MYSQL_USER:-appuser}
      MYSQL_PASSWORD:      ${MYSQL_PASSWORD}
```
- **`${VAR_NAME}`:** Read from `.env` file in the working directory
- **`${VAR_NAME:-default}`:** Use default if not set (e.g., database defaults to "student_housing")
- **MYSQL_ROOT_PASSWORD:** Superuser access (from `.env`, must be provided)
- **MYSQL_DATABASE:** Create this database on startup
- **MYSQL_USER, MYSQL_PASSWORD:** Create this user account (for app use)

```yaml
    ports:
      - "${MYSQL_PORT:-3306}:3306"
```
- **Port mapping:** Container's 3306 → host's 3306 (or custom port from `.env`)
- **Format:** `HOST_PORT:CONTAINER_PORT`
- **Effect:** Access MySQL from host machine at `localhost:MYSQL_PORT`

```yaml
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
```
- **Volume 1 (mysql_data):**
  - Type: Named volume (persists data between restarts)
  - Container path: `/var/lib/mysql` (where MySQL stores databases)
  - Effect: Data survives `docker compose down`
- **Volume 2 (init scripts):**
  - Type: Bind mount (local directory)
  - Host path: `./mysql/init` (schema files)
  - Container path: `/docker-entrypoint-initdb.d` (special init folder)
  - `:ro` = read-only inside container
  - Timing: MySQL runs all `*.sql` files in this folder on first container startup only
  - Effect: Schema is applied automatically (one-time setup)

```yaml
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost",
             "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
```
- **Purpose:** Check if MySQL is responsive
- **Command:** `mysqladmin ping` with root credentials
- **Effect:** If ping fails, container marked unhealthy

```yaml
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```
- **`interval`:** Check every 10 seconds
- **`timeout`:** Wait 5 seconds for response before declaring unhealthy
- **`retries`:** Fail after 5 consecutive failures
- **`start_period`:** Grace period—don't fail healthchecks for 30 seconds after start
- **Combined:** Prevents flaky checks during MySQL startup

```yaml
    networks:
      - internal
```
- **Purpose:** Connect MySQL to "internal" network
- **Effect:** Only backend can reach it (frontend uses API, not direct DB)

#### Service: phpMyAdmin

```yaml
  phpmyadmin:
    image: phpmyadmin:latest
```
- **Purpose:** Web UI for managing MySQL (development convenience tool)

```yaml
    restart: always
```
- **Behavior:** Always restart, even if stopped manually
- **Use case:** Keep admin panel available

```yaml
    depends_on:
      - mysql
```
- **Effect:** Start MySQL before phpMyAdmin
- **Benefit:** Ensures database is ready when admin UI starts

```yaml
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_ARBITRARY: 1
```
- **`PMA_HOST: mysql`:** Container DNS name (Docker's internal network resolution)
- **`PMA_PORT`:** MySQL internal port
- **`PMA_ARBITRARY: 1`:** Allow entering any server/user on login (flexibility for testing)

```yaml
    ports:
      - "8080:80"
```
- **Mapping:** Access phpMyAdmin at `http://localhost:8080` from your computer
- **Container port:** 80 (standard HTTP inside container)

#### Service: Backend

```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: runner
```
- **`context`:** Build context directory (where Dockerfile looks for files)
- **`dockerfile`:** Path to Dockerfile relative to context
- **`target`:** Multi-stage Dockerfile target (e.g., "runner" for production, "builder" for build)
- **Effect:** Builds from `./backend/Dockerfile`, runs `FROM ... AS runner` stage

```yaml
    container_name: student_housing_api
```
- **Fixed container name** for easy reference

```yaml
    restart: unless-stopped
```
- **Auto-restart on crash** (same as MySQL)

```yaml
    depends_on:
      mysql:
        condition: service_healthy
```
- **Dependency:** Start MySQL first
- **`service_healthy`:** Wait until MySQL healthcheck passes
- **Effect:** Backend doesn't start until database is responsive

```yaml
    environment:
      NODE_ENV:    ${NODE_ENV:-development}
      PORT:        5000
      DATABASE_URL: mysql://${MYSQL_USER:-appuser}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE:-student_housing}
```
- **NODE_ENV:** Use `.env` or default to "development"
- **PORT:** API listens on 5000
- **DATABASE_URL:** Connection string
  - Format: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
  - `@mysql` — DNS resolution inside Docker network (not localhost!)
  - Contains credentials from `.env`

```yaml
      JWT_SECRET:               ${JWT_SECRET}
      CLOUDINARY_CLOUD_NAME:    ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY:       ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET:    ${CLOUDINARY_API_SECRET}
      EMAIL_HOST:               ${EMAIL_HOST}
      EMAIL_PORT:               ${EMAIL_PORT:-587}
      EMAIL_USER:               ${EMAIL_USER}
      EMAIL_PASSWORD:           ${EMAIL_PASSWORD}
```
- **All credentials from `.env`** (never hardcoded in docker-compose.yml)
- **Email_PORT defaults to 587** (SMTP)

```yaml
    ports:
      - "${BACKEND_PORT:-5000}:5000"
```
- **Port mapping:** Access API at `http://localhost:BACKEND_PORT`
- **Default:** 5000

```yaml
    volumes:
      - ./backend/src:/app/src:ro
```
- **Development convenience:** Mount source code for hot-reload
- **`./backend/src`:** Host directory
- **`/app/src`:** Container directory
- **`:ro`:** Read-only (container can't modify your files)
- **Effect:** Edit `./backend/src/app.js` → changes visible inside container immediately
- **Note:** Removed in staging/prod for security and performance

```yaml
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```
- **Purpose:** Verify API is responding
- **`wget -qO-`:** Download HTTP response quietly (silent mode)
- **Healthcheck periods:** Similar to MySQL but longer (API slower to start)

```yaml
    networks:
      - internal
      - external
```
- **Dual network membership:**
  - **internal:** Talk to MySQL (no external access)
  - **external:** Accept requests from frontend and host machine

#### Service: Frontend

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:5000}
```
- **Similar build config** as backend
- **`args:`:** Build arguments (passed to `ARG` instructions in Dockerfile)
- **`NEXT_PUBLIC_API_URL`:** Baked into the Next.js client bundle at build time
- **Default:** Points to local backend for development

```yaml
    container_name: student_housing_web
```
- **Fixed container name**

```yaml
    restart: unless-stopped
```
- **Auto-restart**

```yaml
    depends_on:
      backend:
        condition: service_healthy
```
- **Wait for backend** to be healthy before starting frontend
- **Reason:** Frontend needs API to be available

```yaml
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT:     3000
      NEXT_PUBLIC_API_URL: http://backend:5000
```
- **NODE_ENV:** From `.env`
- **PORT:** Next.js listens on 3000
- **NEXT_PUBLIC_API_URL:** Server-side environment variable
  - Different from build-time ARG above
  - This is used by Next.js rewrites proxy (server-side API calls)
  - `http://backend:5000` — uses Docker service name (internal network)

```yaml
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
```
- **Port mapping:** Access frontend at `http://localhost:FRONTEND_PORT`
- **Default:** 3000

```yaml
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```
- **Verify frontend is responding**

#### Networks

```yaml
networks:
  internal:
    driver: bridge
    internal: true
```
- **`driver: bridge`:** Standard Docker network type
- **`internal: true`:** Containers on this network cannot reach the host
- **Effect:** MySQL and backend talk privately; completely isolated from external world

```yaml
  external:
    driver: bridge
```
- **No `internal: true`:** Can reach the host
- **Services:** Backend and frontend (both accessible from your computer)

#### Volumes

```yaml
volumes:
  mysql_data:
    driver: local
```
- **Named volume definition**
- **`driver: local`:** Stored on host machine (default)
- **Persistence:** Survives `docker compose down`
- **Location:** Docker stores on host in `/var/lib/docker/volumes/` (or Docker Desktop equivalent)

---

### Staging Overrides

**File:** `docker-compose.staging.yml`

#### Usage

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```
- **Syntax:** Layer this file on top of base `docker-compose.yml`
- **Effect:** Staging-specific settings override base configuration

#### Backend Changes

```yaml
services:
  backend:
    volumes: []
```
- **Override:** Remove the development source mount
- **Effect:** Run compiled code only (no hot-reload on staging)
- **Why:** Production-like behavior for testing

```yaml
    environment:
      NODE_ENV: staging
```
- **Override:** Change from development to staging
- **Effect:** App runs in staging mode (different log levels, API base URLs, etc.)

#### Frontend Changes

```yaml
  frontend:
    environment:
      NODE_ENV: staging
```
- **Change NODE_ENV to staging**

#### MySQL Changes

```yaml
  mysql:
    ports: []
```
- **Override:** Don't expose MySQL port to host
- **Effect:** Backend accesses MySQL via Docker network only
- **Why:** Prevent accidental direct database access from staging server

---

### Production Overrides

**File:** `docker-compose.prod.yml`

#### Backend Changes

```yaml
services:
  backend:
    volumes: []
```
- **Remove source mount** (compiled code only)

```yaml
    environment:
      NODE_ENV: production
```
- **Run in production mode**

```yaml
    depends_on: []
```
- **Override:** Remove dependency on MySQL container
- **Why:** Production uses managed database (e.g., AWS RDS, Aiven, PlanetScale)
- **Effect:** MySQL container never starts

#### Frontend Changes

```yaml
  frontend:
    environment:
      NODE_ENV: production
```
- **Production mode**

```yaml
    depends_on: []
```
- **No longer wait for backend container** (backend is on separate servers/containers)

#### MySQL Profile

```yaml
  mysql:
    profiles:
      - donotstart
```
- **`profiles`:** Tag this service with "donotstart" profile
- **Effect:** MySQL never starts unless explicitly requested:
  ```bash
  docker compose --profile donotstart up
  ```
- **Default:** MySQL is skipped
- **Why:** Production database is managed externally; no local MySQL needed

---

## Summary Table

| File | Purpose | Triggers | Key Actions |
|------|---------|----------|-------------|
| `backend-ci.yml` | Backend testing | Push/PR to main/develop/feature/* | Lint, type-check, unit tests (with MySQL) |
| `frontend-ci.yml` | Frontend testing | Push/PR to main/develop/feature/* | Lint, type-check, unit tests (no DB) |
| `deploy.yml` | Deploy to environments | Push to develop/main/release/hotfix | Build, SSH to server, run Docker containers |
| `release-tag.yml` | Create releases | PR merged to main from release/* or hotfix/* | Extract version, create git tag, GitHub release |
| `docker-compose.yml` | Base setup | N/A (local dev) | MySQL, backend, frontend, networks, volumes |
| `docker-compose.staging.yml` | Staging overrides | N/A (applied with `-f` flag) | Remove dev mounts, hide MySQL port |
| `docker-compose.prod.yml` | Production overrides | N/A (applied with `-f` flag) | Skip local MySQL (use managed DB) |

---

## Running the Stack

### Local Development

```bash
# In project root with .env file configured
docker compose up --build
```
- Starts all services in development mode
- Source maps mounted for hot-reload
- MySQL exposed on localhost:3306
- Frontend at http://localhost:3000
- Backend at http://localhost:5000
- phpMyAdmin at http://localhost:8080

### Staging Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```
- Runs compiled code only
- MySQL network-isolated
- NODE_ENV=staging for all services

### Production Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
- Runs compiled code only
- No local MySQL (uses external database)
- NODE_ENV=production for all services

---

## Environment Variables (.env)

Required variables for Docker Compose to function:

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_root_password_here
MYSQL_USER=appuser
MYSQL_PASSWORD=your_app_password_here
MYSQL_DATABASE=student_housing

# Backend
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=mysql://appuser:password@mysql:3306/student_housing

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000

# Ports (optional, defaults shown)
MYSQL_PORT=3306
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

---

**Document Version:** 1.0  
**Last Reviewed:** May 4, 2026
