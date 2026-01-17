# Vercel Deployment Guide - Urban Intelligence System

## 🎯 Recommended: Vercel for Frontend + Railway for Backend

### Why This Setup?
- ✅ **Vercel**: Best for Next.js, automatic deploys, free SSL
- ✅ **Railway**: Free Python hosting for FastAPI
- ✅ **Aiven**: PostgreSQL database (already set up)

---

## 📦 Step-by-Step Deployment

### STEP 1: Deploy Backend to Railway (5 min)

**1.1 Sign up:**
- Go to https://railway.app
- Click "Login with GitHub"

**1.2 Create New Project:**
- Dashboard → "New Project"
- "Deploy from GitHub repo"
- Select: `Harsh15505/C3E1xIngenious-7.0`

**1.3 Configure Service:**
```
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**1.4 Add Environment Variables:**
```
DB_HOST = your-database-host
DB_PORT = your-database-port
DB_USER = your-database-user
DB_PASSWORD = your-database-password
DB_NAME = your-database-name
OPENWEATHER_API_KEY = your-openweather-api-key
```

**1.5 Deploy:**
- Click "Deploy"
- Wait 2-3 minutes
- Copy your backend URL: `https://YOUR-APP.railway.app`

**1.6 Update CORS (Important!):**
Add Vercel URL to backend CORS once you have it.

---

### STEP 2: Deploy Frontend to Vercel (3 min)

**2.1 Sign up:**
- Go to https://vercel.com
- Click "Sign Up with GitHub"

**2.2 Import Project:**
- Dashboard → "Add New Project"
- Import Git Repository: `Harsh15505/C3E1xIngenious-7.0`
- Root Directory: **frontend**
- Framework Preset: **Next.js** (auto-detected)

**2.3 Configure Build:**
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**2.4 Add Environment Variable:**
```
NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-APP.railway.app
```
(Use the Railway URL from Step 1.5)

**2.5 Deploy:**
- Click "Deploy"
- Wait 1-2 minutes
- Your site is live! 🎉

**Your URL**: `https://c3e1xingenious-7-0.vercel.app`

---

### STEP 3: Update Backend CORS

**3.1 Edit backend/app/main.py:**

Add your Vercel URL to allowed origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://c3e1xingenious-7-0.vercel.app",  # Your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**3.2 Commit and Push:**
```bash
git add backend/app/main.py
git commit -m "fix: Add Vercel URL to CORS"
git push origin main
```

Railway will auto-deploy the update!

---

## ✅ Verification Checklist

After deployment, test these:

- [ ] Frontend loads at Vercel URL
- [ ] Login page accessible
- [ ] Can login with admin/citizen credentials
- [ ] Dashboard loads without CORS errors
- [ ] API calls work (check browser console)
- [ ] Data displays in dashboards
- [ ] Scenario simulation works
- [ ] Alerts page loads

---

## 🔧 Troubleshooting

### CORS Errors
**Symptom**: "Access-Control-Allow-Origin" error in console

**Fix**: 
1. Verify Vercel URL in backend CORS settings
2. Check Railway logs for errors
3. Ensure CORS middleware is configured

### API Connection Failed
**Symptom**: "Network Error" or "Failed to fetch"

**Fix**:
1. Check Railway backend is running (visit URL in browser)
2. Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
3. Check Railway logs for crashes

### Environment Variables Not Working
**Symptom**: Using localhost URLs in production

**Fix**:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables
3. Redeploy: Deployments → ⋮ → Redeploy

### Database Connection Issues
**Symptom**: 500 errors on API calls

**Fix**:
1. Check Railway logs
2. Verify database credentials in Railway environment variables
3. Test database connection from Railway

---

## 🆓 Free Tier Limits

### Vercel Free:
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ⚠️ 100 builds/day

### Railway Free:
- ✅ 500 hours/month (~20 days)
- ✅ Sleeps after 30 min inactivity
- ⚠️ Cold start: ~10-20 seconds
- 💡 Upgrade to $5/month for always-on

### Aiven (Current Plan):
- Already configured ✅
- Check your plan limits

---

## 🚀 Auto-Deployment

Once set up, every `git push` will:
1. **Railway**: Auto-deploy backend
2. **Vercel**: Auto-deploy frontend
3. Get preview URLs for every PR

**Workflow:**
```bash
# Make changes
git add .
git commit -m "feat: New feature"
git push origin main

# Wait 2-3 minutes
# Both sites automatically updated!
```

---

## 📱 Custom Domain (Optional)

### Add Custom Domain to Vercel:
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)
4. SSL automatic!

---

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Frontend (Vercel) | Free | $0 |
| Backend (Railway) | Free | $0 |
| Database (Aiven) | Current | Check your plan |
| **TOTAL** | | **~$0/month** |

**For production/competition:**
- Railway Hobby: $5/month (always-on, no cold starts)
- Vercel Pro: $20/month (more bandwidth, analytics)

---

## 🎯 Quick Commands

### Local Development:
```bash
# Frontend
cd frontend
npm run dev

# Backend  
cd backend
uvicorn app.main:app --reload --port 8001
```

### Production URLs:
```
Frontend: https://c3e1xingenious-7-0.vercel.app
Backend:  https://YOUR-APP.railway.app
API Docs: https://YOUR-APP.railway.app/docs
```

---

## 📞 Support

### Vercel Issues:
- Docs: https://vercel.com/docs
- Dashboard Logs: Deployments → Function Logs

### Railway Issues:
- Docs: https://docs.railway.app
- Dashboard Logs: Deployments → View Logs

### Debug Steps:
1. Check Vercel deployment logs
2. Check Railway application logs
3. Verify environment variables
4. Test API endpoints directly
5. Check browser console for errors

---

## 🎉 Done!

Your Urban Intelligence System is now live:
- ✅ Frontend on Vercel (fast, reliable)
- ✅ Backend on Railway (serverless Python)
- ✅ Database on Aiven (cloud PostgreSQL)
- ✅ Auto-deployments on every push
- ✅ HTTPS everywhere
- ✅ $0 monthly cost

**Share your live URL:**
`https://c3e1xingenious-7-0.vercel.app`
