# 🚀 Deployment URLs

## Live Applications

### Frontend (Vercel)
- **URL:** https://c3-e1x-ingenious-7-0-y7f6.vercel.app
- **Login:** https://c3-e1x-ingenious-7-0-y7f6.vercel.app/login
- **Admin Dashboard:** https://c3-e1x-ingenious-7-0-y7f6.vercel.app/municipal/dashboard
- **Citizen Dashboard:** https://c3-e1x-ingenious-7-0-y7f6.vercel.app/citizen/dashboard

### Backend (Railway)
- **Base URL:** https://ingeniousxteamc3e1-production.up.railway.app
- **API Docs:** https://ingeniousxteamc3e1-production.up.railway.app/docs
- **Health Check:** https://ingeniousxteamc3e1-production.up.railway.app/health
- **API Endpoints:** https://ingeniousxteamc3e1-production.up.railway.app/api/v1/*

---

## 🔧 Update Frontend to Use Railway Backend

### In Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select project: `c3-e1x-ingenious-7-0-y7f6`
3. Go to **Settings** → **Environment Variables**
4. Find or add: `NEXT_PUBLIC_API_URL`
5. Set value to: `https://ingeniousxteamc3e1-production.up.railway.app`
6. Click **Save**
7. Go to **Deployments** tab
8. Click ⋯ menu on latest deployment → **Redeploy**

---

## 🧪 Test Your Deployment

### Test Backend API:

```bash
# Health check
curl https://ingeniousxteamc3e1-production.up.railway.app/health

# API Documentation (open in browser)
https://ingeniousxteamc3e1-production.up.railway.app/docs

# Test login endpoint
curl -X POST https://ingeniousxteamc3e1-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ingenious.com","password":"admin123"}'
```

### Test Frontend:

1. Open: https://c3-e1x-ingenious-7-0-y7f6.vercel.app/login
2. Login with: `admin@ingenious.com` / `admin123`
3. Check if data loads (should fetch from Railway backend)

---

## 📊 Monitoring

### Railway:
- Dashboard: https://railway.app
- View logs, metrics, deployments

### Vercel:
- Dashboard: https://vercel.com/dashboard
- View deployments, analytics, logs

---

## 🔑 Test Credentials

**Admin Account:**
- Email: `admin@ingenious.com`
- Password: `admin123`
- Access: Full municipal dashboard

**Citizen Account:**
- Email: `citizen@ingenious.com`
- Password: `citizen123`
- Access: Public citizen portal
