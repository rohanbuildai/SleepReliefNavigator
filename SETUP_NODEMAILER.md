# Setting Up Nodemailer for Emails

## Option 1: Gmail SMTP (Recommended for Testing)

### Step 1: Enable 2FA on Your Google Account

1. Go to https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", enable **2-Step Verification**

### Step 2: Create an App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → name it "Sleep Relief Navigator"
4. Click **Generate**
5. Copy the 16-character password (spaces don't matter)

### Step 3: Update Your `.env` File

```env
GMAIL_USER=rohan.buildai@gmail.com
GMAIL_PASS=abcdxxxxabcdxxxx
EMAIL_FROM=rohan.buildai@gmail.com
```

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

### Test:

Register a new user - email should arrive at the registered email!

---

## Option 2: Custom SMTP Server

### For Production Use:

Use any SMTP provider:
- SendGrid
- Mailgun  
- AWS SES
- Your own mail server

### `.env` Configuration:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
SMTP_SECURE=false
EMAIL_FROM=hello@yourdomain.com
```

---

## Gmail App Password Troubleshooting

### "Username and password not accepted"
- Make sure 2FA is enabled FIRST
- Use the App Password, NOT your regular password
- The App Password is 16 characters with no spaces

### "Less secure app" error
- You don't need to enable "Less secure apps" anymore
- Just use App Passwords with 2FA enabled

### "Please log in via your web browser"
- Gmail blocks app access by default
- App Passwords bypass this

---

## Quick Setup (5 minutes)

1. **Go to:** https://myaccount.google.com/security
2. **Enable 2-Step Verification**
3. **Go to:** https://myaccount.google.com/apppasswords
4. **Create App Password** (select Mail, Other)
5. **Add to `.env`:**
   ```
   GMAIL_USER=your@gmail.com
   GMAIL_PASS=the_app_password
   ```
6. **Restart backend**

---

## Cost

**Free** - Gmail SMTP is free with an App Password.

**Limit:** 500 emails/day for new accounts, increases over time.