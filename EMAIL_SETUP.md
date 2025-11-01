# Welcome Email Setup Guide

Your welcome email function is ready! Follow these steps to enable it.

## ✅ What's Already Done

1. **Cloud Function Created**: `sendWelcomeEmail` in `functions/index.js`
2. **Auto-triggers**: Fires automatically when a new user document is created in Firestore
3. **Beautiful HTML Email Template**: Includes role-specific content for buyers and owners
4. **Forgot Password**: Fully functional password reset via email

## 🚀 Option 1: Using Resend (Recommended - Easy & Free Tier)

Resend is modern, developer-friendly, and has a generous free tier.

### Steps:

1. **Sign up at [resend.com](https://resend.com)**
   - Get your API key

2. **Install Resend in functions:**
   ```bash
   cd functions
   npm install resend
   ```

3. **Set your API key:**
   ```bash
   firebase functions:config:set resend.api_key="re_FrEqdEra_3WDfm5UoCofazvVcZswSZk6t"
   ```

4. **Uncomment lines 281-287 in `functions/index.js`:**
   ```javascript
   const { Resend } = require('resend');
   const resend = new Resend(process.env.RESEND_API_KEY || functions.config().resend.api_key);
   await resend.emails.send({
     from: 'onboarding@yourdomain.com',
     ...welcomeEmail
   });
   ```

5. **Deploy:**
   ```bash
   firebase deploy --only functions:sendWelcomeEmail
   ```

## 🚀 Option 2: Using SendGrid

### Steps:

1. **Sign up at [sendgrid.com](https://sendgrid.com)**
   - Get your API key

2. **Install SendGrid:**
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```

3. **Set your API key:**
   ```bash
   firebase functions:config:set sendgrid.api_key="SG.xxxxxxxxxxxxx"
   ```

4. **Uncomment lines 276-279 in `functions/index.js`:**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY || functions.config().sendgrid.api_key);
   await sgMail.send(welcomeEmail);
   ```

5. **Deploy:**
   ```bash
   firebase deploy --only functions:sendWelcomeEmail
   ```

## 🚀 Option 3: Firebase Extensions (No Code Required!)

1. **Install the "Trigger Email" extension:**
   ```bash
   firebase ext:install firebase/firestore-send-email
   ```

2. **Follow the prompts to configure:**
   - SMTP server details
   - Email templates
   - Trigger collection: `users`

3. **Done!** The extension handles everything automatically.

## 📧 Password Reset Emails

Password reset emails are **already working**! They use Firebase's built-in email service.

### To customize the password reset email template:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **oyola-ai**
3. Go to **Authentication** → **Templates** tab
4. Click on **Password reset** template
5. Customize the subject and body
6. Click **Save**

## 🎯 Testing

### Test Welcome Email:
1. Sign up a new user
2. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only sendWelcomeEmail
   ```

### Test Password Reset:
1. Click "Forgot password?" on sign-in page
2. Enter your email
3. Check your inbox for the reset link

## 💡 Tips

- **Free Tiers**: Both Resend and SendGrid offer free tiers (100 emails/day for Resend, 100/day for SendGrid)
- **Domain Setup**: For production, set up a custom domain with proper SPF/DKIM records
- **Testing**: Use [Mailhog](https://github.com/mailhog/MailHog) or [Mailtrap](https://mailtrap.io) for local testing

## 📝 Current Status

✅ **Forgot Password** - Working with Firebase's built-in email  
⏳ **Welcome Email** - Function ready, needs email service configured  
✅ **Email Template** - Beautiful HTML template created  
✅ **Auto-trigger** - Fires on user signup automatically  

## 🔧 Environment Variables

If deploying to production, set these:

```bash
# For Resend
firebase functions:config:set resend.api_key="your_key_here"

# For SendGrid  
firebase functions:config:set sendgrid.api_key="your_key_here"

# Your app URL (for email links)
firebase functions:config:set app.url="https://yourdomain.com"
```

---

Need help? Check the comments in `functions/index.js` or Firebase documentation!

