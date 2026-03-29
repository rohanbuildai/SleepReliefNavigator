# Sleep Relief Navigator

A production-ready, full-stack MERN application providing personalized non-prescription sleep guidance for people with anxiety-driven sleep problems.

## 🎯 Product Overview

Sleep Relief Navigator is a health-adjacent, evidence-aware, non-prescription sleep decision-support platform. It helps users who:
- Cannot fall asleep because of racing thoughts
- Wake up in the middle of the night and cannot get back to sleep
- Feel "tired but wired"
- Have bedtime anxiety / anticipatory anxiety
- Want non-prescription sleep help without dependency

## 📁 Project Structure

```
sleep-relief-navigator/
├── frontend/          # React 18 + Vite frontend
├── backend/           # Express.js + MongoDB backend
├── README.md          # This file
└── ARCHITECTURE.md    # Detailed architecture documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Stripe account (for payments)
- Resend account (for emails, optional)

### Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - MONGODB_URI
# - JWT_SECRET (generate with: openssl rand -hex 64)
# - JWT_REFRESH_SECRET (generate with: openssl rand -hex 64)
# - STRIPE_SECRET_KEY
# - RESEND_API_KEY

# Install dependencies
npm install

# Seed database with initial data
npm run seed

# Start development server
npm run dev
```

Backend runs on http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Edit .env with:
# - VITE_API_URL=http://localhost:5000/api/v1
# - VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:5173

## 🔑 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sleeprelief

# Auth (REQUIRED - Generate strong secrets)
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ONE_TIME=price_xxx
STRIPE_PRICE_SUBSCRIPTION=price_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yoursite.com

# Upstash Redis (optional, for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# URLs
FRONTEND_URL=http://localhost:5173

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
```

## 📦 Available Scripts

### Backend

```bash
npm run dev          # Start development server
npm start            # Start production server
npm run seed         # Seed database with initial data
npm run test         # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run test         # Run tests
```

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with refresh token rotation
- **Payments**: Stripe (checkout sessions, webhooks, subscriptions)
- **Email**: Resend
- **Logging**: Pino
- **Rate Limiting**: express-rate-limit (Upstash Redis optional)

### Frontend Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React

### API Design

Versioned REST API: `/api/v1/`

| Route | Description |
|-------|-------------|
| `/auth` | Authentication (register, login, refresh, logout) |
| `/quiz` | Quiz sessions and completion |
| `/plans` | Generated sleep plans |
| `/evidence` | Evidence library and interventions |
| `/outcomes` | Outcome logging |
| `/billing` | Payments and subscriptions |
| `/webhooks` | Stripe webhook handler |
| `/admin` | Admin dashboard and management |

## 🔒 Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT Access tokens**: 15-minute expiry, stored in memory
- **Refresh tokens**: 7-day expiry, httpOnly cookies, hashed in DB
- **Token rotation**: Old tokens invalidated on refresh
- **Rate limiting**: Per-route limits to prevent abuse
- **Input validation**: express-validator on all endpoints
- **Security headers**: Helmet middleware
- **CORS**: Strict allowlist configuration
- **CSRF**: SameSite cookies

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run all tests
npm run test:ui             # UI mode
npm run test:coverage       # Coverage report
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test
```

## 🚢 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend URL
   - `VITE_STRIPE_PUBLIC_KEY`: Stripe public key
3. Deploy

### Backend (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables:
   - `NODE_ENV`: production
   - `PORT`: 5000
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret
   - `JWT_REFRESH_SECRET`: Your refresh secret
   - `STRIPE_SECRET_KEY`: Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
   - `RESEND_API_KEY`: Resend API key
   - `FRONTEND_URL`: Your frontend URL
3. Deploy

### MongoDB Atlas Setup

1. Create a free cluster at mongodb.com
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Copy connection string to `MONGODB_URI`

### Stripe Setup

1. Get API keys from Stripe Dashboard
2. Create products and prices
3. Update `.env` with price IDs
4. Set up webhook endpoint: `https://your-backend.com/api/v1/webhooks/stripe`
5. Add webhook secret to `STRIPE_WEBHOOK_SECRET`

### Stripe Webhook Testing (Local)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe

# Copy the webhook signing secret and add to .env
```

## 📊 Database Schema

### Models

- **User**: Authentication, profile, Stripe customer ID
- **AuthSession**: Active session tracking
- **RefreshToken**: Token storage (hashed)
- **QuizSession**: Quiz progress and responses
- **GeneratedPlan**: Personalized sleep plans
- **SleepProfile**: Classification profiles
- **Intervention**: Sleep interventions (supplements, techniques)
- **RecommendationRule**: Rules for recommendation engine
- **OutcomeLog**: User sleep outcome tracking
- **EvidenceEntry**: Evidence library content
- **Subscription**: Stripe subscription data
- **Payment**: Payment history
- **WebhookEvent**: Idempotent webhook processing
- **AuditLog**: Admin action logging

## 🎯 Recommendation Engine

The recommendation engine uses deterministic rule-based logic:

1. **Profile Classification**: User responses → Sleep profile (5 profiles)
2. **Contraindication Filtering**: Safety flags → Excluded interventions
3. **Intervention Scoring**: Profile match + safety + preferences → Ranked list
4. **Plan Generation**: Top interventions → Tonight plan, backup, avoid list

### Sleep Profiles

1. Racing Mind Sleep Onset
2. Middle-of-Night Adrenaline Wake
3. Tired But Wired Hyperarousal
4. Bedtime Anticipatory Anxiety
5. Body Tension Dominant Sleeplessness

## 📱 Routes

### Public
- `/` - Landing page
- `/quiz` - Sleep assessment quiz
- `/quiz/results/:planId` - Plan results
- `/help-now` - Urgent help page
- `/pricing` - Pricing page
- `/library` - Evidence library
- `/library/:slug` - Library detail
- `/login` - Login
- `/register` - Register
- `/terms` - Terms of service
- `/privacy` - Privacy policy

### Protected (Auth Required)
- `/dashboard` - User dashboard
- `/dashboard/plans` - Saved plans
- `/dashboard/outcomes` - Outcome tracking
- `/dashboard/billing` - Subscription management
- `/dashboard/settings` - Account settings

### Admin
- `/admin` - Admin dashboard
- `/admin/interventions` - Manage interventions
- `/admin/rules` - Manage rules
- `/admin/analytics` - View analytics

## ⚠️ Disclaimer

**This product provides educational wellness guidance and personalized informational recommendations. It is NOT:**

- Medical advice
- Medical diagnosis
- Medical treatment
- A substitute for professional care

**If you have persistent sleep problems, severe insomnia, or suspect a medical condition, please consult a healthcare professional.**

## 📄 License

MIT License

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/)
- [Stripe](https://stripe.com/)
- [Resend](https://resend.com/)