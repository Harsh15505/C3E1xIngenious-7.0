# Railway Deployment Guide

## 📦 Files Created

1. **Procfile** - Tells Railway how to start the app
2. **railway.json** - Railway-specific configuration
3. **runtime.txt** - Specifies Python version (3.12.1)

## 🔧 Railway Setup Steps

### Step 1: Create New Project on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `Harsh15505/C3E1xIngenious-7.0`
5. Select the `backend` folder as root directory

### Step 2: Configure Environment Variables

Go to your Railway service → **Variables** tab and add these:

```bash
# Database (from your Aiven account)
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=25937
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE
DB_NAME=defaultdb

# External APIs
OPENWEATHER_API_KEY=your_openweather_api_key_here
AQICN_API_KEY=your_aqicn_key_or_leave_empty

# AI/LLM
GROQ_API_KEY=your_groq_api_key_here

# JWT Authentication (IMPORTANT: Generate a new secret for production!)
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API Configuration
API_V1_PREFIX=/api/v1
PROJECT_NAME=Urban Intelligence Platform
```

### Step 3: Configure Build Settings

Railway should auto-detect Python, but verify:

**Root Directory**: `/backend`  
**Build Command**: (leave empty, uses nixpacks.toml)  
**Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 4: Deploy

Railway will automatically deploy. Check logs:
- Click on your service
- Go to "Deployments" tab
- Click on latest deployment
- View logs

### Step 5: Get Railway URL

Once deployed:
1. Go to Settings tab
2. Find "Domains" section
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://your-app.up.railway.app`)

### Step 6: Update Frontend

Update Vercel environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

Redeploy Vercel frontend.

## 🐛 Common Issues & Fixes

### Issue: "SSL certificate verify failed"

**Fix**: The code now handles this automatically. If you still see errors, ensure your Aiven database allows connections from Railway IPs.

### Issue: "Module not found"

**Fix**: Ensure `requirements.txt` is in the backend folder and all dependencies are listed.

### Issue: "Address already in use"

**Fix**: Make sure start command uses `$PORT` variable (already configured in Procfile).

### Issue: "Database connection refused"

**Fix**: 
1. Check environment variables are set correctly in Railway
2. Ensure Aiven firewall allows Railway connections (usually auto-allowed)
3. Verify DB credentials in Railway match your Aiven credentials

### Issue: "ca-certificate.crt not found"

**Fix**: Already handled in updated `database.py` - will use default SSL context on Railway.

## ✅ Verification Checklist

After deployment, test these endpoints:

1. Health check: `https://your-app.up.railway.app/health`
2. API docs: `https://your-app.up.railway.app/docs`
3. Login: `POST https://your-app.up.railway.app/api/v1/auth/login`

## 📊 Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History of all deployments

Access via Railway dashboard.

## 💰 Pricing Note

Railway offers $5 free credit per month. Your backend should fit within this if usage is moderate.

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to main branch:

```bash
git add .
git commit -m "your message"
git push origin main
```

Railway will detect changes and redeploy automatically.
