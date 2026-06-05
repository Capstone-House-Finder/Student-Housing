# Deployment Secrets & Variables Guide

Based on the pipeline configuration (`.github/workflows/deploy.yml`), this project features a robust deployment setup where **both** the Frontend and Backend are deployed to **Vercel**. Deployments target different environments dynamically based on the branch name:

- `main` branch → **Production**
- `develop` branch → **Staging** (Preview)
- `release/*` branches → **UAT** (Preview)

Because of this structure, you need to configure secrets in **two places**: GitHub (for the Actions to run) and Vercel (for the deployed apps to use).

---

## Step 1: Configure Secrets in Vercel

Vercel hosts your actual applications. Since you have a separate Frontend and Backend project on Vercel, you must add variables to each project.

**In your Vercel Dashboard:**

1. Go to your **Backend Project** -> **Settings** -> **Environment Variables**.
2. Add the following backend variables. When you add a variable in Vercel, it asks you which environments it should apply to.
   - **For Production secrets** (like your live Aiven DB): Check **only** the `Production` box.
   - **For Staging secrets** (like your test Aiven DB): Check **only** the `Preview` box.

   **Add these to the Backend Vercel Project:**
   - `DATABASE_URL` (Use your production Aiven URL for Prod, and a test Aiven URL for Preview)
   - `JWT_SECRET` (You can use the same string for both, or separate ones)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL` (Set to your live frontend URL for Prod, and `https://*-yourusername.vercel.app` or similar for Preview).

3. Go to your **Frontend Project** -> **Settings** -> **Environment Variables**.
4. Add the following variable:
   - `NEXT_PUBLIC_API_URL`
     - **For Production**: Set to your live Vercel Backend URL (e.g., `https://backend-student-housing.vercel.app`). Check the `Production` box.
     - **For Preview/Staging**: Set to your staging Backend URL. Check the `Preview` box.

---

## Step 2: Configure Secrets in GitHub (For the CI/CD Pipeline)

Your `deploy.yml` file uses GitHub Actions to trigger Vercel deployments. It needs Vercel API tokens to authorize the deployments.

**In your GitHub Repository:**

1. Go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Under the **Repository secrets** section, click **New repository secret**.
3. Add these required deployment tokens (These apply to ALL environments):
   - `VERCEL_TOKEN`: Your personal Vercel Access Token (Get this from Vercel Account Settings -> Tokens).
   - `VERCEL_ORG_ID`: Your Vercel Organization ID.
   - `VERCEL_FRONTEND_PROJECT_ID`: The unique Project ID for your Vercel Frontend.
   - `VERCEL_BACKEND_PROJECT_ID`: The unique Project ID for your Vercel Backend.

> [!TIP]
> To find your Vercel Project/Org IDs, link your project locally using the `vercel link` command in your terminal, and it will generate a `.vercel/project.json` file containing both IDs.

---

## Step 3: GitHub Environments (Optional but Recommended)

In your `deploy.yml`, you may notice `environment: name: ${{ needs.resolve-env.outputs.env_name }}`. This means GitHub is tracking your deployments across environments!

1. In your GitHub Repo, go to **Settings** -> **Environments**.
2. Click **New environment**. Create three environments exactly matching these names:
   - `production`
   - `staging`
   - `uat`
3. (Optional) For the `production` environment, you can check the box for **"Required reviewers"**. This means whenever you merge to `main`, the deployment will pause, and it will require you to click "Approve" before pushing the code to the live Vercel servers!

---

## Summary Checklist

- [ ] Added `DATABASE_URL` and `JWT_SECRET` (and others) to the **Backend Vercel Project** (targeting Prod/Preview appropriately).
- [ ] Added `NEXT_PUBLIC_API_URL` to the **Frontend Vercel Project** (targeting Prod/Preview appropriately).
- [ ] Added `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_FRONTEND_PROJECT_ID`, and `VERCEL_BACKEND_PROJECT_ID` to **GitHub Repository Secrets**.

Once these are set, pushing to `develop` will automatically deploy a Staging preview with Staging variables, and pushing to `main` will deploy the live Production app with Production variables!
