# Sleep Relief Navigator - Production Architecture

## Overview
Sleep Relief Navigator is a health-adjacent, evidence-aware, non-prescription sleep decision-support platform built on the MERN stack (MongoDB, Express.js, React, Node.js).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Mobile/Web     │  │  Admin Portal   │  │  Stripe Webhook │              │
│  │  (React SPA)    │  │  (React SPA)    │  │  (Backend)      │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Vite + React 18 + Tailwind CSS + shadcn/ui + React Router         │   │
│  │  TanStack Query + React Hook Form + Zod + Framer Motion             │   │
│  │                                                                       │   │
│  │  Pages: Landing, Quiz, Results, Dashboard, Library, Admin           │   │
│  │  Components: Auth, Quiz Flow, Plans, Evidence Library              │   │
│  │  Services: API Client, Analytics, Auth Context                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            │ HTTPS + REST API (JSON)
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                          │
│                         (Vercel/Railway/Render)                             │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Routes: /api/v1/auth, /api/v1/quiz, /api/v1/plans, /api/v1/billing │   │
│  │  Controllers: Auth, Quiz, Plans, Billing, Admin                     │   │
│  │  Middleware: JWT Auth, Rate Limiter, CSRF, Helmet, CORS             │   │
│  │  Services: Recommendation Engine, Email, Stripe, Analytics          │   │
│  │  Models: User, SleepProfile, Intervention, Plan, Subscription        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
    ┌───────┼────────┬──────────────┐
    ▼       ▼        ▼              ▼
┌───────┐ ┌───────┐ ┌────────┐ ┌────────┐
│MongoDB│ │Redis  │ │Stripe  │ │Resend  │
│Atlas  │ │Upstash│ │Webhooks│ │Email   │
└───────┘ └───────┘ └────────┘ └────────┘
```

## Frontend Architecture

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── api/
│   │   ├── client.js           # Axios instance with interceptors
│   │   ├── auth.js             # Auth API calls
│   │   ├── quiz.js             # Quiz API calls
│   │   ├── plans.js            # Plans API calls
│   │   ├── billing.js          # Billing API calls
│   │   └── admin.js            # Admin API calls
│   ├── assets/
│   │   └── icons/              # Static assets
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── SEOHead.jsx
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── Footer.jsx
│   │   ├── ui/
│   │   │   ├── Badge.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Tooltip.jsx
│   │   ├── quiz/
│   │   │   ├── QuizProgress.jsx
│   │   │   ├── QuizQuestion.jsx
│   │   │   ├── QuizOption.jsx
│   │   │   └── QuizResults.jsx
│   │   ├── dashboard/
│   │   │   ├── PlanCard.jsx
│   │   │   ├── OutcomeLogger.jsx
│   │   │   └── StatsOverview.jsx
│   │   ├── billing/
│   │   │   ├── PricingCard.jsx
│   │   │   └── CheckoutButton.jsx
│   │   └── admin/
│   │       ├── InterventionManager.jsx
│   │       └── RuleEditor.jsx
│   ├── context/
│   │   ├── AuthContext.jsx     # Auth state management
│   │   ├── ThemeContext.jsx    # Dark/light mode
│   │   └── ToastContext.jsx    # Notifications
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── PasswordResetForm.jsx
│   │   ├── quiz/
│   │   │   ├── QuizFlow.jsx
│   │   │   ├── QuizIntro.jsx
│   │   │   └── QuizSteps.jsx
│   │   ├── plans/
│   │   │   ├── TonightPlan.jsx
│   │   │   ├── SevenDayPlan.jsx
│   │   │   └── AvoidList.jsx
│   │   └── evidence/
│   │       ├── InterventionCard.jsx
│   │       └── EvidenceLibrary.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useQuiz.js
│   │   ├── usePlans.js
│   │   └── useAnalytics.js
│   ├── lib/
│   │   ├── utils.js            # Utility functions
│   │   └── validators.js       # Zod schemas (shared concept)
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Quiz.jsx
│   │   ├── QuizResults.jsx
│   │   ├── HelpNow.jsx
│   │   ├── Pricing.jsx
│   │   ├── Library.jsx
│   │   ├── LibraryDetail.jsx
│   │   ├── Learn.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DashboardPlans.jsx
│   │   ├── DashboardOutcomes.jsx
│   │   ├── DashboardBilling.jsx
│   │   ├── DashboardSettings.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminInterventions.jsx
│   │   ├── AdminRules.jsx
│   │   ├── AdminAnalytics.jsx
│   │   ├── Terms.jsx
│   │   ├── Privacy.jsx
│   │   └── NotFound.jsx
│   ├── routes/
│   │   ├── index.jsx           # Route definitions
│   │   ├── ProtectedRoute.jsx  # Auth guard
│   │   └── AdminRoute.jsx      # Admin guard
│   ├── schemas/
│   │   └── validation.js       # Form validation schemas
│   ├── services/
│   │   ├── analytics.js        # Analytics tracking
│   │   └── theme.js           # Theme service
│   ├── store/
│   │   └── index.js           # Global state
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── utils/
│   │   ├── cn.js               # Class name utility
│   │   └── format.js           # Formatting utilities
│   ├── App.jsx                 # Root component
│   └── main.jsx                # Entry point
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── jsconfig.json
```

## Backend Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js            # Main config loader
│   │   ├── database.js         # MongoDB connection
│   │   ├── redis.js            # Upstash Redis config
│   │   └── stripe.js           # Stripe config
│   ├── constants/
│   │   ├── index.js            # App constants
│   │   ├── roles.js            # RBAC roles
│   │   └── quiz.js             # Quiz configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── quizController.js
│   │   ├── planController.js
│   │   ├── evidenceController.js
│   │   ├── billingController.js
│   │   ├── webhookController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── index.js            # Route aggregator
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── quiz.js
│   │   ├── plans.js
│   │   ├── evidence.js
│   │   ├── billing.js
│   │   ├── webhooks.js
│   │   └── admin.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── quizService.js
│   │   ├── recommendationEngine.js
│   │   ├── planService.js
│   │   ├── stripeService.js
│   │   ├── analyticsService.js
│   │   └── cacheService.js
│   ├── models/
│   │   ├── User.js
│   │   ├── AuthSession.js
│   │   ├── RefreshToken.js
│   │   ├── QuizSession.js
│   │   ├── SleepProfile.js
│   │   ├── Intervention.js
│   │   ├── RecommendationRule.js
│   │   ├── GeneratedPlan.js
│   │   ├── OutcomeLog.js
│   │   ├── EvidenceEntry.js
│   │   ├── Subscription.js
│   │   ├── Payment.js
│   │   ├── WebhookEvent.js
│   │   └── AuditLog.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── admin.js            # RBAC check
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── validator.js        # Request validation
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── requestId.js        # Request tracing
│   │   ├── logger.js           # Request logging
│   │   └── security.js        # Helmet, CORS, etc.
│   ├── utils/
│   │   ├── asyncHandler.js     # Async wrapper
│   │   ├── ApiError.js         # Custom error class
│   │   ├── emailTemplates.js   # Email HTML templates
│   │   └── helpers.js          # Utility functions
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── quizValidator.js
│   │   └── planValidator.js
│   ├── lib/
│   │   ├── logger.js          # Winston/Pino logger
│   │   └── sentry.js          # Sentry initialization
│   ├── jobs/
│   │   └── subscriptionSync.js # Cron jobs
│   ├── scripts/
│   │   ├── seed.js             # Main seed script
│   │   ├── seedInterventions.js
│   │   ├── seedEvidence.js
│   │   ├── seedProfiles.js
│   │   ├── seedRules.js
│   │   └── seedPricing.js
│   ├── emails/
│   │   ├── welcome.js
│   │   ├── emailVerification.js
│   │   ├── passwordReset.js
│   │   └── planSummary.js
│   └── data/
│       ├── interventions.json
│       ├── profiles.json
│       ├── evidence.json
│       └── rules.json
├── tests/
│   ├── unit/
│   │   ├── recommendationEngine.test.js
│   │   ├── authService.test.js
│   │   └── contraindication.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── quiz.test.js
│       └── billing.test.js
├── .env.example
├── package.json
├── jsconfig.json
└── server.js
```

## Key Technical Decisions

### 1. Authentication Strategy
- **JWT Access Tokens**: Short-lived (15 minutes), stored in memory
- **Refresh Tokens**: Long-lived (7 days), stored in httpOnly secure cookies, hashed in DB
- **Token Rotation**: New refresh token issued on each refresh, old one invalidated
- **Session Tracking**: AuthSessions collection tracks device/location metadata

### 2. Recommendation Engine
- **Deterministic**: No AI/LLM, pure rule-based logic
- **Profile Classification**: 5 initial sleep profiles
- **Contraindication Filtering**: Safety flags prevent harmful recommendations
- **Intervention Ranking**: Scored based on profile match and safety

### 3. Payment Integration
- **Stripe**: Single purchases + subscriptions
- **Webhook-driven**: All payment state changes via webhooks
- **Idempotent Processing**: WebhookEvents collection prevents duplicates
- **Customer Portal**: Self-service subscription management

### 4. Rate Limiting Strategy
- **Auth Routes**: Strict (5 attempts per minute)
- **Quiz/Plans**: Moderate (30 per minute)
- **Evidence Library**: Light (100 per minute)
- **Upstash Redis**: Distributed rate limiting for production

### 5. Analytics Approach
- **Frontend**: PostHog integration (pluggable)
- **Backend**: Sentry for errors, Winston for structured logs
- **Key Events**: Quiz completion, plan generation, purchase, subscription

## Security Architecture

### Defense in Depth Layers
1. **Network**: HTTPS everywhere, CORS allowlist
2. **Application**: Helmet, input validation, SQL injection prevention
3. **Auth**: bcrypt, JWT, refresh token rotation, session tracking
4. **Data**: Encryption at rest (MongoDB Atlas), field-level sensitive data handling

### Security Headers (Helmet)
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

## Environment Configuration

### Frontend Variables (frontend/.env.example)
```
VITE_API_URL=https://api.sleepreliefnavigator.com
VITE_APP_URL=https://sleepreliefnavigator.com
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_POSTHOG_KEY=phc_xxx
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Backend Variables (backend/.env.example)
```
# Server
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sleeprelief

# Auth
JWT_SECRET=your-jwt-secret-256-bits
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REFRESH_TOKEN_SECRET=your-refresh-secret-256-bits

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ONE_TIME=price_xxx
STRIPE_PRICE_SUBSCRIPTION=price_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@sleepreliefnavigator.com

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# App
APP_URL=https://sleepreliefnavigator.com
FRONTEND_URL=https://sleepreliefnavigator.com
```

## Deployment Architecture

### Frontend: Vercel
- Automatic HTTPS
- Edge network
- Environment variables in dashboard
- Preview deployments for PRs

### Backend: Railway/Render
- Node.js 20 runtime
- Health check endpoint
- Environment variables
- Auto-scaling

### Database: MongoDB Atlas
- M10 cluster for production
- IP allowlist
- Encrypted at rest
- Automated backups

### Payments: Stripe
- Webhook endpoint
- Customer portal
- Subscription management

## Testing Strategy

### Unit Tests (Jest)
- Recommendation engine rules
- Auth service logic
- Contraindication filtering

### Integration Tests (Supertest)
- API endpoints
- Auth flows
- Quiz completion

### E2E Tests (Playwright)
- Landing → Quiz → Plan
- Sign up → Login → Dashboard
- Purchase flow (mocked Stripe)