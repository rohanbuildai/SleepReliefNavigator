# Deploy Sleep Relief Navigator to Render

## Backend Deployment (Render)

### Prerequisites
- GitHub repository with your code
- MongoDB Atlas cluster (or use Render's managed MongoDB)
- Resend API key for emails
- Stripe keys for payments

### Step 1: Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `sleep-relief-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Starter` (free tier) |

### Step 2: Add Environment Variables

Go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sleeprelief?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-256-bit-secret-here
JWT_REFRESH_SECRET=another-super-secure-256-bit-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ONE_TIME=price_xxxxx
STRIPE_PRICE_SUBSCRIPTION=price_xxxxx
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Sleep Relief Navigator
FRONTEND_URL=https://your-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-domain.com
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### Step 3: Configure Health Check

Under **Health Check**:
- Path: `/api/v1/health`
- Initial Delay (seconds): `30`

### Step 4: Deploy

Click **"Create Web Service"** - it will build and deploy.

---

## Frontend Deployment (Vercel - Recommended)

### Step 1: Prepare Your Frontend

Update `frontend/.env` for production:
```env
VITE_API_URL=https://sleep-relief-backend.onrender.com/api/v1
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Import your repository
3. Set root directory: `frontend`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://sleep-relief-backend.onrender.com/api/v1`)
5. Deploy!

---

## MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user with read/write permissions
3. Whitelist Render's IP (0.0.0.0/0 for development)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/sleeprelief
   ```

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://sleep-relief-backend.onrender.com/api/v1/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Alternative: Render Blueprints

You can use Render's Blueprint for infrastructure-as-code:

Create `render.yaml` in root:
```yaml
services:
  - type: web
    name: sleep-relief-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      # Add other env vars...
```

---

## Troubleshooting

### CORS Errors?
Make sure `ALLOWED_ORIGINS` includes your Vercel domain.

### Webhook Not Working?
- Render webhook URL needs to be publicly accessible
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe`

### Build Failing?
- Check Build Logs on Render
- Make sure `package.json` has correct scripts

---

## Free Tier Limits

| Resource | Free Limit |
|----------|------------|
| Web Service | 750 hours/month |
| Disk | 100MB |
| Sleep after 15min | Yes (cold starts) |

For production, upgrade to paid tier ($7/month for hobby).