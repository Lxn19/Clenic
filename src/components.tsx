import React from 'react'

// Color palettes from design
export const PALETTES = {
  lavender: { purple: '#D8CDEB', blue: '#C7DDF2', pink: '#F0D9E8' },
  mint: { purple: '#BEE3C6', blue: '#CFE3EC', pink: '#FBE5C0' },
  blush: { purple: '#F7C9C0', blue: '#C9E4DE', pink: '#F9E2AE' },
}

export const TRANSLATIONS = {
  en: {
    collapse: 'Collapse',
    leadDentist: 'Lead Dentist',
    search: 'Search…',
    orthodonticBanner: 'Today is an Orthodontic Day — all scheduled visits are orthodontic appointments.',
    scheduleAVisit: 'Schedule a Visit',
    patientName: 'Patient Name',
    phoneNumber: 'Phone Number',
    date: 'Date',
    time: 'Time',
    type: 'Type',
    duration: 'Duration',
    notes: 'Notes',
    orthodonticCheckbox: 'Orthodontic appointment',
    optional: '(optional)',
    scheduleAppointmentBtn: 'Schedule Appointment',
    justScheduled: 'Just Scheduled',
    noAppointmentsYet: 'No appointments scheduled yet this session.',
    receiptHistory: 'Receipt History',
    close: 'Close',
    noReceiptsYet: 'No receipts confirmed yet.',
    patientDetails: 'Patient Details',
    age: 'Age',
    guardian: 'Parent / Guardian',
    ifMinor: '(if minor)',
    dentalInsurance: 'Dental Insurance',
    medicalInsurance: 'Medical Insurance',
    anesthesia: 'Anesthesia Recommendation',
    nextAppointment: 'Next Appointment',
    medicalHistory: 'Medical History',
    specialNeeds: 'Special Needs',
    teethChart: 'Teeth Chart',
    clickTeethHint: 'Click teeth treated today',
    permanentTeeth: 'Permanent Teeth',
    primaryTeeth: 'Primary Teeth',
    selectedTeeth: 'Selected Teeth',
    prescription: 'Prescription',
    dentistNote: "Dentist's Note",
    cost: 'Cost',
    confirmReceipt: 'Confirm Receipt',
    lastVisit: 'Last Visit',
    nextVisit: 'Next Visit',
    xray: 'X-Ray',
    navDashboard: 'Dashboard',
    navAppointments: 'Appointments',
    navNewAppointment: 'New Appointment',
    navReceipt: 'Receipt',
    navPatients: 'Patients',
    welcomeDashboard: 'Welcome, Dr. Ghassan',
    todaysOverview: "Today's overview and upcoming appointments",
    appointmentsHeading: 'Appointments',
    appointmentsSubtitle: 'View all scheduled appointments',
    newApptHeading: 'Schedule a Visit',
    newApptSubtitle: 'Create a new appointment',
    receiptHeading: 'Receipt',
    receiptSubtitle: 'Patient treatment records and invoices',
    patientsHeading: 'Patients',
    patientsSubtitle: 'All patient information',
    enableReminders: 'Enable reminders',
    notificationsEnabled: 'Notifications enabled',
    reminderWindow: 'Reminder window',
    hoursBeforeAppt: 'hours before appointment',
    todaysSchedule: "Today's Schedule",
    viewAll: 'View all →',
    noApptToday: 'No appointments scheduled for today',
    weeklyAppointments: 'Weekly Appointments',
    activityThisWeek: 'Activity this week',
    thisWeek: 'This Week',
    todaysAppointments: "Today's Appointments",
    fromYesterdaySuffix: 'from yesterday',
    sameAsYesterday: 'Same as yesterday',
    completed: 'Completed',
    successRate: 'success rate',
    pending: 'Pending',
    actionNeeded: 'Action needed',
    allClear: 'All clear',
    atAGlance: 'At a Glance',
    totalPatients: 'Total Patients',
    cancelledToday: 'Cancelled Today',
    avgVisitDuration: 'Avg. Visit Duration',
    upcomingLabel: 'Upcoming',
    noUpcoming: 'No upcoming appointments',
    scheduleClear: 'Schedule is clear 🎉',
    generalCheckup: 'General Checkup',
    appointment: 'Appointment',
    patient: 'Patient',
    clinicInfo: 'Clinic Info',
    clinicInfoText: 'Dr. Ghassan Saed Abbas is available today. All orthodontic appointments are confirmed for the afternoon session.',
    orthodonticDayTag: 'Orthodontic Day',
    morningOpenTag: 'Morning Open',
    orthoTag: 'Ortho',
    prescriptionBtn: 'Prescription',
    medicationsGiven: 'Medications Given',
    treatmentHistoryLabel: 'Treatment History',
    noMedications: 'No medications on record.',
    noTreatments: 'No treatments on record.',
    backToPatients: 'Back to Patients',
    patientHistoryHeading: 'Patient History',
    patientHistorySubtitle: 'Prescriptions, treatments, and X-ray',
    uploadXray: 'Click to upload X-ray',
    changeXray: 'Click to change X-ray',
    noTeethMarked: 'No teeth marked',
    teethLabelPrefix: 'Teeth',
    selectPatient: 'Select Patient',
    choosePatientPlaceholder: '— Choose a patient —',
    procedure: 'Procedure',
    statusActive: 'Active',
    statusFollowUp: 'Follow-up',
    statusInactive: 'Inactive',
    statusConfirmed: 'Confirmed',
    statusPending: 'Pending',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    noAppointmentsListed: 'No appointments for this day',
    noPatientsYet: 'No patients yet. Schedule an appointment to add one.',
    noXrayOnFile: 'No X-ray images on file yet.',
    hasInsurance: 'Has insurance',
    noInsurance: "Doesn't have insurance",
  },
  ar: {
    collapse: 'طي',
    leadDentist: 'طبيب أسنان رئيسي',
    search: 'بحث…',
    orthodonticBanner: 'اليوم هو يوم تقويم الأسنان — جميع المواعيد المجدولة اليوم لتقويم الأسنان.',
    scheduleAVisit: 'جدولة زيارة',
    patientName: 'اسم المريض',
    phoneNumber: 'رقم الهاتف',
    date: 'التاريخ',
    time: 'الوقت',
    type: 'النوع',
    duration: 'المدة',
    notes: 'ملاحظات',
    orthodonticCheckbox: 'موعد تقويم أسنان',
    optional: '(اختياري)',
    scheduleAppointmentBtn: 'جدولة الموعد',
    justScheduled: 'تم جدولته الآن',
    noAppointmentsYet: 'لم تُجدول أي مواعيد في هذه الجلسة بعد.',
    receiptHistory: 'سجل الفواتير',
    close: 'إغلاق',
    noReceiptsYet: 'لا توجد فواتير مؤكدة بعد.',
    patientDetails: 'بيانات المريض',
    age: 'العمر',
    guardian: 'ولي الأمر / الوصي',
    ifMinor: '(للقاصرين)',
    dentalInsurance: 'التأمين السني',
    medicalInsurance: 'التأمين الطبي',
    anesthesia: 'التوصية بالتخدير',
    nextAppointment: 'الموعد القادم',
    medicalHistory: 'التاريخ الطبي',
    specialNeeds: 'احتياجات خاصة',
    teethChart: 'مخطط الأسنان',
    clickTeethHint: 'اضغط على الأسنان المعالجة اليوم',
    permanentTeeth: 'الأسنان الدائمة',
    primaryTeeth: 'الأسنان اللبنية',
    selectedTeeth: 'الأسنان المحددة',
    prescription: 'الوصفة الطبية',
    dentistNote: 'ملاحظة الطبيب',
    cost: 'التكلفة',
    confirmReceipt: 'تأكيد الفاتورة',
    lastVisit: 'آخر زيارة',
    nextVisit: 'الزيارة القادمة',
    xray: 'صورة الأشعة',
    navDashboard: 'لوحة التحكم',
    navAppointments: 'المواعيد',
    navNewAppointment: 'موعد جديد',
    navReceipt: 'الفاتورة',
    navPatients: 'المرضى',
    welcomeDashboard: 'مرحباً، د. غسان',
    todaysOverview: 'نظرة عامة على اليوم والمواعيد القادمة',
    appointmentsHeading: 'المواعيد',
    appointmentsSubtitle: 'عرض جميع المواعيد المجدولة',
    newApptHeading: 'جدولة زيارة',
    newApptSubtitle: 'إنشاء موعد جديد',
    receiptHeading: 'الفاتورة',
    receiptSubtitle: 'سجلات علاج المرضى والفواتير',
    patientsHeading: 'المرضى',
    patientsSubtitle: 'جميع معلومات المرضى',
    enableReminders: 'تفعيل التذكيرات',
    notificationsEnabled: 'تم تفعيل الإشعارات',
    reminderWindow: 'فترة التذكير',
    hoursBeforeAppt: 'ساعات قبل الموعد',
    todaysSchedule: 'جدول اليوم',
    viewAll: 'عرض الكل ←',
    noApptToday: 'لا توجد مواعيد مجدولة لهذا اليوم',
    weeklyAppointments: 'المواعيد الأسبوعية',
    activityThisWeek: 'النشاط هذا الأسبوع',
    thisWeek: 'هذا الأسبوع',
    todaysAppointments: 'مواعيد اليوم',
    fromYesterdaySuffix: 'عن الأمس',
    sameAsYesterday: 'نفس عدد الأمس',
    completed: 'مكتمل',
    successRate: 'نسبة النجاح',
    pending: 'قيد الانتظار',
    actionNeeded: 'يتطلب إجراء',
    allClear: 'لا يوجد شيء معلق',
    atAGlance: 'نظرة سريعة',
    totalPatients: 'إجمالي المرضى',
    cancelledToday: 'ملغى اليوم',
    avgVisitDuration: 'متوسط مدة الزيارة',
    upcomingLabel: 'القادمة',
    noUpcoming: 'لا توجد مواعيد قادمة',
    scheduleClear: 'الجدول فارغ 🎉',
    generalCheckup: 'فحص عام',
    appointment: 'موعد',
    patient: 'مريض',
    clinicInfo: 'معلومات العيادة',
    clinicInfoText: 'الدكتور غسان سعيد عباس متواجد اليوم. جميع مواعيد تقويم الأسنان مؤكدة لجلسة بعد الظهر.',
    orthodonticDayTag: 'يوم تقويم الأسنان',
    morningOpenTag: 'صباح مفتوح',
    orthoTag: 'تقويم',
    prescriptionBtn: 'الوصفة الطبية',
    medicationsGiven: 'الأدوية الموصوفة',
    treatmentHistoryLabel: 'سجل العلاجات',
    noMedications: 'لا توجد أدوية مسجلة.',
    noTreatments: 'لا توجد علاجات مسجلة.',
    backToPatients: 'العودة إلى المرضى',
    patientHistoryHeading: 'سجل المريض',
    patientHistorySubtitle: 'الوصفات الطبية والعلاجات وصورة الأشعة',
    uploadXray: 'اضغط لرفع صورة الأشعة',
    changeXray: 'اضغط لتغيير صورة الأشعة',
    noTeethMarked: 'لا توجد أسنان محددة',
    teethLabelPrefix: 'الأسنان',
    selectPatient: 'اختر المريض',
    choosePatientPlaceholder: '— اختر مريضاً —',
    procedure: 'الإجراء',
    statusActive: 'نشط',
    statusFollowUp: 'متابعة',
    statusInactive: 'غير نشط',
    statusConfirmed: 'مؤكد',
    statusPending: 'قيد الانتظار',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغى',
    noAppointmentsListed: 'لا توجد مواعيد لهذا اليوم',
    noPatientsYet: 'لا يوجد مرضى بعد. جدول موعداً لإضافة مريض.',
    noXrayOnFile: 'لا توجد صور أشعة مسجلة بعد.',
    hasInsurance: 'لديه تأمين',
    noInsurance: 'لا يوجد لديه تأمين',
  },
}

// Sidebar Navigation
interface SidebarProps {
  isCompact: boolean
  onToggleCompact: () => void
  currentView: string
  onViewChange: (view: string) => void
  palette: typeof PALETTES['lavender']
  onLanguageToggle?: () => void
  language?: 'en' | 'ar'
}

export function Sidebar({
  isCompact,
  onToggleCompact,
  currentView,
  onViewChange,
  palette,
  language = 'en',
}: SidebarProps) {
  const sidebarWidth = isCompact ? '80px' : '260px'
  const showLabels = !isCompact
  const t = TRANSLATIONS[language]
  const isRtl = language === 'ar'

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: 'dashboard', isDashboard: true },
    { id: 'appointments', label: t.navAppointments, icon: 'calendar', isAppointments: true },
    { id: 'new-appointment', label: t.navNewAppointment, icon: 'plus-calendar', isNewAppointment: true },
    { id: 'receipt', label: t.navReceipt, icon: 'receipt', isReceipt: true },
    { id: 'patients', label: t.navPatients, icon: 'patients', isPatients: true },
  ]

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        width: sidebarWidth,
        flex: 'none',
        background: '#FFFFFF',
        borderRight: isRtl ? 'none' : '1px solid #F1EDF8',
        borderLeft: isRtl ? '1px solid #F1EDF8' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: `24px ${isCompact ? '12px' : '20px'}`,
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width .2s ease',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 4px 28px',
          borderBottom: '1px solid #F1EDF8',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: palette.purple,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            color: '#5C3FA0',
            fontSize: '16px',
          }}
        >
          C
        </div>
        {showLabels && <div style={{ fontSize: '17px', fontWeight: 800, color: '#2E2A3A' }}>Clenic</div>}
      </div>

      {/* Nav Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '11px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              background: currentView === item.id ? '#FAF9FC' : 'transparent',
              color: currentView === item.id ? palette.purple : '#8A8398',
              transition: 'all .15s ease',
            }}
          >
            <SidebarIcon type={item.icon} color={currentView === item.id ? palette.purple : '#8A8398'} />
            {showLabels && (
              <div style={{ fontSize: '14.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</div>
            )}
          </div>
        ))}
      </div>

      {/* Collapse Toggle */}
      <div
        onClick={onToggleCompact}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 12px',
          borderRadius: '12px',
          cursor: 'pointer',
          marginBottom: '12px',
          color: '#8A8398',
        }}
        title="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            d="M11 3 L5.5 9 L11 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {showLabels && <div style={{ fontSize: '13px', fontWeight: 600 }}>{t.collapse}</div>}
      </div>

      {/* User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '14px', background: '#F9F7FC' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: palette.blue,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            color: '#3E6C96',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          DR
        </div>
        {showLabels && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#2E2A3A', whiteSpace: 'nowrap' }}>Dr. Ghassan Saed Abbas</div>
            <div style={{ fontSize: '11.5px', color: '#8A8398', whiteSpace: 'nowrap' }}>{t.leadDentist}</div>
          </div>
        )}
      </div>
    </div>
  )
}

interface SidebarIconProps {
  type: string
  color: string
}

function SidebarIcon({ type, color }: SidebarIconProps) {
  const iconMap: Record<string, React.ReactNode> = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1" y="1" width="7" height="7" rx="2" fill={color} />
        <rect x="10" y="1" width="7" height="7" rx="2" fill={color} opacity="0.5" />
        <rect x="1" y="10" width="7" height="7" rx="2" fill={color} opacity="0.5" />
        <rect x="10" y="10" width="7" height="7" rx="2" fill={color} />
      </svg>
    ),
    calendar: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="2.5" width="15" height="14" rx="3" fill="none" stroke={color} strokeWidth="1.6" />
        <line x1="1.5" y1="6.5" x2="16.5" y2="6.5" stroke={color} strokeWidth="1.6" />
        <circle cx="5.5" cy="10.5" r="1.3" fill={color} />
        <circle cx="10.5" cy="10.5" r="1.3" fill={color} />
      </svg>
    ),
    'plus-calendar': (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <rect x="1.5" y="2.5" width="15" height="14" rx="3" fill="none" stroke={color} strokeWidth="1.6" />
        <line x1="1.5" y1="6.5" x2="16.5" y2="6.5" stroke={color} strokeWidth="1.6" />
        <line x1="9" y1="9.5" x2="9" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6.5" y1="11.75" x2="11.5" y2="11.75" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    receipt: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path
          d="M3.5 1.5h11v15l-2-1.3-1.8 1.3-1.8-1.3-1.8 1.3-1.8-1.3-1.8 1.3z"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <line x1="6" y1="5.2" x2="12" y2="5.2" stroke={color} strokeWidth="1.3" />
        <line x1="6" y1="8" x2="12" y2="8" stroke={color} strokeWidth="1.3" />
        <line x1="6" y1="10.8" x2="10" y2="10.8" stroke={color} strokeWidth="1.3" />
      </svg>
    ),
    patients: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="6" r="3.4" fill={color} />
        <path d="M2.5 16c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" fill={color} opacity="0.55" />
      </svg>
    ),
  }

  return <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{iconMap[type]}</div>
}