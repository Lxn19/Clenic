# WhatsApp Reminders Setup Guide

Your Clenic dental clinic app now supports automatic WhatsApp reminders that are sent to patients 12 hours before their appointments. This guide will walk you through setting up Twilio's WhatsApp integration.

## Overview

The app will automatically send WhatsApp messages to patients' phone numbers with appointment reminders 12 hours before the scheduled appointment time.

## Prerequisites

1. A Twilio account (free trial or paid)
2. Patient phone numbers in E.164 format (e.g., +1234567890 where 1 is country code)

## Step-by-Step Setup

### Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Click "Sign up" and create your account
3. Verify your email and phone number
4. You'll get a free trial account with $15 credit

### Step 2: Set Up WhatsApp in Twilio Console

1. Log in to your [Twilio Console](https://console.twilio.com)
2. In the left sidebar, find **"Develop"** → **"Messaging"** → **"Try it out"** → **"Send a WhatsApp Message"**
3. This will guide you through WhatsApp sandbox setup
4. Follow the prompts to:
   - Join the Twilio WhatsApp Sandbox
   - Send a test message to verify everything works
5. You'll get a sandbox phone number in format: `+1415555XXXX`

### Step 3: Get Your API Credentials

1. Go to [Twilio Console Settings](https://console.twilio.com/us/account/settings/general)
2. Copy your **Account SID** (starts with "AC")
3. Click "Show" to reveal your **Auth Token**
4. Copy the Auth Token securely

### Step 4: Configure WhatsApp in Clenic

1. Open your Clenic app in your browser
2. Click the **"Settings"** link in the top navigation
3. Enable the "Enable WhatsApp reminders" checkbox
4. Fill in the three fields:
   - **Twilio Account SID**: Paste your Account SID from step 3
   - **Twilio Auth Token**: Paste your Auth Token from step 3
   - **Twilio WhatsApp Number**: Paste the sandbox number you got in step 2 (format: +1415555XXXX)
5. Click "Save WhatsApp Settings"

### Step 5: Add Patient Phone Numbers

When adding or editing a patient:
1. Include their phone number in **E.164 format**
   - USA: +1 followed by 10-digit number (e.g., +12025551234)
   - International: +[country code][number] (e.g., +442071838750 for UK)
2. Save the patient

### Step 6: Test It Out

1. Create a test appointment for a patient with a valid phone number
2. Schedule it for 12 hours from now
3. Wait for the reminder to be sent (you'll see it in your browser console and WhatsApp)
4. Check your WhatsApp to receive the reminder message

## Phone Number Formats by Country

| Country | Format | Example |
|---------|--------|---------|
| USA | +1 | +12025551234 |
| Canada | +1 | +14165551234 |
| UK | +44 | +442071838750 |
| Germany | +49 | +493012345678 |
| France | +33 | +33123456789 |
| Australia | +61 | +61212345678 |
| India | +91 | +919876543210 |
| Mexico | +52 | +525512345678 |

## Feature Details

### Automatic Reminders

- Reminders are sent **automatically** 12 hours before each appointment
- The app checks for upcoming appointments continuously
- Each appointment is only reminded once (tracked in the system)

### Reminder Message Format

```
Hi [Patient Name],

This is a reminder from Archer Dentistry. You have a dental appointment scheduled for [Date/Time].

Please reply CONFIRM if you'll be attending.

Thank you!
```

### How It Works

1. The app checks every few seconds for appointments within the 12-hour window
2. When an appointment is found, it:
   - Sends a browser notification (if permitted)
   - Sends a WhatsApp message (if configured and phone number exists)
   - Marks the appointment as notified to avoid duplicate messages
3. Phone numbers are validated and formatted to E.164 format automatically

## Troubleshooting

### WhatsApp Message Not Sending

**Check:**
1. Is "Enable WhatsApp reminders" toggled ON in Settings?
2. Does the patient have a phone number saved?
3. Is the phone number in E.164 format with country code?
4. Are your Twilio credentials correct and copied completely?
5. Does your Twilio account have credit remaining?

**Debugging:**
- Open browser developer tools (F12)
- Go to Console tab
- Look for messages like:
  - "WhatsApp reminder sent to [Name]" = Success
  - "WhatsApp reminder failed or not configured" = Check settings and credentials

### "The WhatsApp Sandbox is not active"

This happens if your Twilio WhatsApp Sandbox hasn't been activated:
1. Go back to Twilio Console
2. Find Messaging → Try it out → Send a WhatsApp Message
3. Follow the sandbox activation again
4. Update the phone number in Settings

### Invalid Credentials Error

1. Go back to Twilio Console
2. Make sure you copied the **entire** Account SID and Auth Token
3. Check for extra spaces at the beginning or end
4. Paste them again carefully in Settings

## Going to Production

The Twilio WhatsApp Sandbox is for testing only. For production:

1. Apply to Twilio for a **Business Account**
2. Get WhatsApp Business Profile verified
3. Request a dedicated WhatsApp number
4. Update your phone number in Clenic Settings

See [Twilio WhatsApp Production Guide](https://www.twilio.com/docs/whatsapp/production) for details.

## Security Notes

- Your Twilio credentials are stored **locally in your browser** using localStorage
- Credentials are **never sent** to external servers except Twilio
- It's a good practice to rotate your Auth Token periodically
- If credentials are leaked, regenerate your Auth Token in Twilio Console

## Data Privacy

- Patient phone numbers are used **only** to send appointment reminders
- Messages are sent through Twilio's secure infrastructure
- Messages are not stored in Clenic—only in Twilio's message history
- Deleting an appointment stops future reminders from being sent

## Support

For Twilio issues, visit:
- [Twilio Support](https://support.twilio.com/)
- [WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp)

---

**Questions?** Check the Settings page in your Clenic app for inline help and setup instructions.
