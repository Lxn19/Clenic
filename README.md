# Clenic - Dental Clinic Appointment Management System

A modern React + TypeScript web application for dentists to manage appointments, patient records, and treatment details with automatic WhatsApp reminders.

## Features

✅ **Three Main Pages**
- **Today**: View all appointments scheduled for today with quick details
- **Set Appointment**: Manage patient records and schedule appointments
- **Receipts**: Comprehensive invoice and clinical record form for patient treatment
- **Settings**: Configure WhatsApp reminders and API credentials

✅ **Appointment Management**
- Schedule appointments with date, time, and detailed notes
- Track patient contact information and medical history
- Automatic 12-hour reminders to patients via WhatsApp
- Browser notifications for dentist alerts
- Persistent storage using local database (alasql)

✅ **Patient Management**
- Store complete patient profiles with contact info
- Track medical history, allergies, and special needs
- Store home address and insurance information
- Link multiple appointments to each patient

✅ **Dental Treatment Tracking**
- Interactive tooth chart with both permanent (1-32) and primary (A-T) teeth
- Mark treated teeth during appointments
- Document specific tooth treatments in clinical notes
- Track referral reasons and medical history

✅ **Professional Receipt/Invoice**
- Create detailed treatment invoices
- Generate payment receipts for services rendered
- Print-friendly format matching dental clinic standards
- Document provider information and insurance details

✅ **WhatsApp Integration**
- Automatic appointment reminders sent via WhatsApp
- Reminders sent 12 hours before scheduled appointments
- Integrated with Twilio WhatsApp API
- Secure credential storage (local browser storage)

## Quick Start

### Installation

1. Clone or download the repository
2. Navigate to the project directory:
   ```bash
   cd Clenic
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown (typically `http://localhost:5174`)

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder, ready to deploy.

## Usage Guide

### Adding a Patient

1. Go to **"Set Appointment"** page
2. Click "Add New Patient"
3. Fill in patient details:
   - Name (required)
   - Phone number (important for WhatsApp reminders - include country code like +1)
   - Date of birth
   - Gender
   - Guardian/Emergency contact
   - Address and contact information
   - Insurance details
   - Medical history and special notes
4. Click "Save Patient"

### Scheduling an Appointment

1. Go to **"Set Appointment"** page
2. Select a patient from the list
3. Click "New Appointment" for that patient
4. Fill in appointment details:
   - Date and time (use datetime picker)
   - Appointment reason/purpose
   - Treatment notes
   - Receipt details (description of work done)
   - Select treated teeth from the interactive chart
5. Click "Save Appointment"

### Viewing Today's Appointments

1. Go to **"Today"** page
2. See all appointments scheduled for today
3. Click on any appointment to view full details
4. Details include date, time, patient name, reason, notes, and treated teeth
5. Upcoming reminders (within 12 hours) are listed at the bottom

### Creating a Receipt/Invoice

1. Go to **"Receipts"** page
2. Select an appointment from the list (automatically loads first appointment)
3. The form shows:
   - Provider information (clinic details)
   - Patient demographics and contact info
   - Medical history and referral reasons
   - Treatment details
   - Tooth chart showing treated teeth
   - Receipt/invoice section with treatment description
4. Update any fields as needed
5. Click "Update Receipt" to save changes
6. Use your browser's print function to print the invoice

### Setting Up WhatsApp Reminders

1. Go to **"Settings"** page
2. Follow the setup guide in the app or read `WHATSAPP_SETUP.md` file
3. Enable "Enable WhatsApp reminders" checkbox
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - WhatsApp phone number
5. Click "Save WhatsApp Settings"
6. Make sure patients have phone numbers with country codes (e.g., +1 for USA)

The app will automatically send WhatsApp messages to patients 12 hours before their appointments.

## Data Storage

All data is stored locally in your browser using the browser's localStorage:
- Patient information
- Appointments and treatment records
- WhatsApp API credentials
- Notification history

**Important:** 
- Data is stored only on this device
- Clearing browser data will delete all records
- Export records or back up regularly
- No data is sent to external servers except Twilio for WhatsApp messages

## Technology Stack

- **Framework**: React 19.2.7 with TypeScript
- **Build Tool**: Vite 8.1.1
- **Database**: alasql (SQL-like queries on localStorage)
- **Routing**: React Router 7.18.1
- **Styling**: CSS with CSS variables for theming
- **External API**: Twilio WhatsApp API (for reminders)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires localStorage support

## Key Files

- `src/App.tsx` - Main application component with all three pages
- `src/db.ts` - Database layer with alasql integration
- `src/whatsapp.ts` - WhatsApp/Twilio integration module
- `src/App.css` - Complete styling for all pages
- `WHATSAPP_SETUP.md` - Detailed WhatsApp setup guide

## Features in Detail

### 1. Today Page
- Displays all appointments for the current date
- Shows appointment time, patient name, reason, and notes
- Click to expand and see full details
- Lists upcoming reminders (within 12-hour window)
- Quick indication of notification permission status

### 2. Set Appointment Page
- Search patients by name
- View all patients in the system
- Create new patients with comprehensive information
- Schedule appointments for selected patient
- Edit existing appointments
- Interactive tooth selection for treatment tracking
- Pre-filled appointment form when editing

### 3. Receipts Page
- View and edit appointment details in invoice format
- Professional receipt layout
- Patient information section
- Medical history documentation
- Referral reasons with checkboxes
- Interactive permanent and primary tooth charts
- Treatment notes and receipt details
- Print-ready format
- Auto-selects first appointment if none selected

### 4. Settings Page
- Configure WhatsApp/Twilio credentials
- Enable/disable WhatsApp reminders
- Input validation and success feedback
- Help documentation with setup steps
- Store credentials securely in browser

## Notification System

### Browser Notifications
- Requires explicit permission (grant when prompted)
- Shows popup notification 12 hours before appointment
- One notification per appointment (tracked by system)
- Can be dismissed in browser settings

### WhatsApp Reminders
- Automatic message sent 12 hours before appointment
- Message includes date, time, and patient name
- Requires Twilio WhatsApp setup (see WHATSAPP_SETUP.md)
- Phone numbers must include country code
- One message per appointment (tracked by system)

## Troubleshooting

### "npm run dev" fails
- Make sure you're in the Clenic directory
- Run `npm install` first
- Check Node.js version (14+)

### Appointments not showing
- Make sure the date is set correctly (must be today for Today page)
- Check that patient is assigned to the appointment
- Try refreshing the page

### WhatsApp messages not sending
- Check Settings page - is WhatsApp enabled?
- Verify patient has a phone number
- Phone numbers must include country code (+1, +44, etc.)
- Check Twilio credentials are correctly entered
- See WHATSAPP_SETUP.md for detailed troubleshooting

### Data disappeared
- Check if you cleared browser cache/storage
- Browser storage is device-specific
- Clearing browser data deletes all records
- Backup records by exporting them regularly

## Security & Privacy

### Data Storage
- All data stored locally in your browser
- No server-side storage
- No third-party data collection (except Twilio for WhatsApp)

### WhatsApp API
- Credentials stored in browser localStorage only
- Only Twilio receives patient phone numbers (for sending messages)
- Messages sent through Twilio's encrypted infrastructure
- You control all data - can clear anytime

### Best Practices
- Don't share your browser/device with others
- Clear browser data if using shared computer
- Rotate Twilio Auth Token regularly
- Backup patient data periodically
- Use strong passwords for Twilio account

## Deployment

To deploy this app:

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider:
   - Netlify (drag and drop)
   - Vercel (connect Git repo)
   - AWS S3 + CloudFront
   - Any static hosting service

3. Ensure the hosting provider supports:
   - Single Page App routing
   - HTTPS (recommended for security)
   - Browser localStorage access

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run code linter (oxlint)
- `npm run preview` - Preview production build locally

### Project Structure

```
Clenic/
├── src/
│   ├── App.tsx           # Main app component
│   ├── App.css           # All styles
│   ├── db.ts             # Database layer
│   ├── whatsapp.ts       # WhatsApp integration
│   └── main.tsx          # Entry point
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── WHATSAPP_SETUP.md     # WhatsApp guide
```

## Future Enhancements

Possible features to add:
- Patient appointment history timeline
- Payment tracking and invoicing
- Prescription management
- Staff/assistant user accounts
- Cloud backup and sync
- Mobile app version
- Email reminders in addition to WhatsApp
- Appointment confirmation through WhatsApp
- Multi-language support

## Support & Help

- Read `WHATSAPP_SETUP.md` for WhatsApp configuration help
- Check Settings page for inline help text
- Review application pages for tooltips and guidance
- Clear your browser cache if experiencing issues
- Ensure JavaScript is enabled in your browser

## License

This project is provided as-is for dental clinic management purposes.

## Version

Current Version: 1.0.0
- Initial release with appointment scheduling
- WhatsApp reminder integration
- Receipt/invoice generation
- Comprehensive patient record tracking

---

**Built with React, TypeScript, and Vite**

For more information, visit the respective project repositories:
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
