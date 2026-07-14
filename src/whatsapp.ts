export interface WhatsAppConfig {
  accountSid: string
  authToken: string
  twilioPhoneNumber: string
  enabled: boolean
  // Optional: SID of a Twilio Content Template pre-approved with two
  // Quick Reply buttons ("Confirm" / "Decline"). WhatsApp only allows
  // interactive buttons through an approved template — free-form
  // messages cannot render buttons. If this isn't set, we fall back
  // to a plain-text message asking the patient to reply CONFIRM or DECLINE.
  confirmContentSid?: string
}

let config: WhatsAppConfig | null = null

export function setWhatsAppConfig(newConfig: WhatsAppConfig) {
  config = newConfig
  localStorage.setItem('whatsapp-config', JSON.stringify(newConfig))
}

export function loadWhatsAppConfig(): WhatsAppConfig | null {
  if (config) {
    return config
  }
  try {
    const stored = localStorage.getItem('whatsapp-config')
    if (stored) {
      config = JSON.parse(stored)
      return config
    }
  } catch (error) {
    console.warn('Failed to load WhatsApp config', error)
  }
  return null
}

export async function sendWhatsAppReminder(
  patientPhone: string,
  patientName: string,
  appointmentDateTime: string,
  language: 'en' | 'ar' = 'en',
): Promise<boolean> {
  const cfg = loadWhatsAppConfig()

  if (!cfg || !cfg.enabled || !cfg.accountSid || !cfg.authToken) {
    console.warn('WhatsApp not configured')
    return false
  }

  const appointmentTime = new Date(appointmentDateTime)
  const formattedDate = formatReminderDateTime(appointmentTime, language)

  try {
    const params = new URLSearchParams({
      From: 'whatsapp:' + cfg.twilioPhoneNumber,
      To: 'whatsapp:' + formatPhoneNumber(patientPhone),
    })

    if (cfg.confirmContentSid) {
      // Interactive Confirm/Decline buttons via a pre-approved Twilio Content Template.
      // The template itself must be authored/approved in the target language.
      params.set('ContentSid', cfg.confirmContentSid)
      params.set('ContentVariables', JSON.stringify({ 1: patientName, 2: formattedDate }))
    } else {
      // Plain-text fallback — WhatsApp won't render real buttons without an approved template.
      const message =
        language === 'ar'
          ? `مرحباً ${patientName}،\n\nهذا تذكير من عيادة الطبيب غسان سعيد عباس  Archer لطب الأسنان. لديك موعد أسنان محدد في ${formattedDate}.\n\nيرجى الرد بـ "تأكيد" لتأكيد الموعد أو "إلغاء" لإلغائه.\n\nشكراً لك!`
          : `Hi ${patientName},\n\nThis is a reminder from Archer Dentistry. You have a dental appointment scheduled for ${formattedDate}.\n\nPlease reply CONFIRM to confirm or DECLINE to cancel.\n\nThank you!`
      params.set('Body', message)
    }

    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + cfg.accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(cfg.accountSid + ':' + cfg.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (response.ok) {
      console.log('WhatsApp reminder sent to', patientPhone)
      return true
    }

    console.warn('Failed to send WhatsApp message', response.statusText)
    return false
  } catch (error) {
    console.warn('Error sending WhatsApp message', error)
    return false
  }
}

// Interprets an inbound WhatsApp reply (either the button payload or free
// text like "CONFIRM"/"DECLINE", or their Arabic equivalents "تأكيد"/"إلغاء")
// into an appointment status.
//
// NOTE: this app is a client-only React front end with no server, so it
// cannot receive Twilio's inbound-message webhook itself. To actually apply
// a patient's reply automatically, point your Twilio WhatsApp webhook at a
// small server endpoint you control, have that endpoint call this function
// (or the same logic) with the reply text, and persist the resulting status
// wherever your app's data store lives — this function is provided as that
// piece of shared logic.
export function interpretWhatsAppReply(replyText: string): 'Confirmed' | 'Cancelled' | null {
  const normalized = replyText.trim().toLowerCase()
  if (normalized.includes('confirm') || normalized.includes('تأكيد')) return 'Confirmed'
  if (normalized.includes('decline') || normalized.includes('cancel') || normalized.includes('إلغاء')) return 'Cancelled'
  return null
}

// Formats a date as "Weekday, Mon Day at 10:00am" (English) or the Arabic
// equivalent — a clean 12-hour time with no leading zero and a lowercase
// am/pm, since that's easier for patients to read at a glance than a
// locale-default 24-hour or verbose format.
function formatReminderDateTime(date: Date, language: 'en' | 'ar'): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const isPM = hours >= 12
  hours = hours % 12
  if (hours === 0) hours = 12
  const minuteStr = String(minutes).padStart(2, '0')

  if (language === 'ar') {
    const weekday = date.toLocaleDateString('ar-EG', { weekday: 'long' })
    const monthDay = date.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })
    const period = isPM ? 'م' : 'ص'
    return `${weekday}، ${monthDay} الساعة ${hours}:${minuteStr}${period}`
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const period = isPM ? 'pm' : 'am'
  return `${weekday}, ${monthDay} at ${hours}:${minuteStr}${period}`
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // If it starts with 1 (US), add +1
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return '+' + cleaned
  }

  // If it's 10 digits (US without country code)
  if (cleaned.length === 10) {
    return '+1' + cleaned
  }

  // Assume it already has country code or add +
  if (cleaned.length > 10) {
    return '+' + cleaned
  }

  return phone
}