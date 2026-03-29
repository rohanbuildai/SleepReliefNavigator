# Setting Up Resend for Email Sending

## Quick Setup (5 minutes)

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up with GitHub or email
3. Verify your email address

### Step 2: Create API Key

1. Go to https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name it: `Sleep Relief Navigator`
4. Copy the key (starts with `re_`)

### Step 3: Add to Your `.env` File

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Step 4: Verify Your Domain (Required for Production)

1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `sleepreliefnavigator.com`)
4. Add the DNS records Resend provides
5. Wait for verification (can take a few minutes to 48 hours)

### Step 5: Update EMAIL_FROM

```env
EMAIL_FROM=hello@sleepreliefnavigator.com
```

---

## Testing Without Domain Verification

Resend allows sending to your own email without domain verification:

1. Go to https://resend.com/domains
2. Click **"Add and verify a free temporary subdomain"**
3. Use the provided email address for testing

Or simply use Resend's test mode:
```env
EMAIL_FROM=onboarding@resend.dev
```

---

## For Local Development (Emails Mocked)

If you don't have a Resend API key yet, emails will be **mocked** (logged to console):

```
[Email Mock] Welcome email would be sent to: user@example.com
```

This lets you test the app flow without real emails.

---

## Update Backend `.env`

```bash
cd backend
cp .env.example .env
# Then edit .env and add:
RESEND_API_KEY=re_your_actual_key_here
EMAIL_FROM=hello@yourdomain.com
```

---

## Restart Backend

```bash
npm run dev
```

You should see:
```
[Email] Resend initialized successfully
```

---

## Testing Email Sending

Register a new user - you should see either:
- **Mock mode**: `[Email Mock] Welcome email would be sent to: ...`
- **Live mode**: Email delivered to inbox

---

## Troubleshooting

### "Domain not verified" error
- Add and verify your domain in Resend dashboard

### "API key invalid" error
- Check your `RESEND_API_KEY` is correct
- Make sure you copied the full key (including `re_` prefix)

### Emails not arriving
- Check spam folder
- Verify sender email matches your verified domain
- Check Resend dashboard for delivery status

---

## Cost

**Free tier:** 100 emails/day, 3000 emails/month

For production: $20/month for unlimited emails.