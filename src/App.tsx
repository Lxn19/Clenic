import React, { useEffect, useMemo, useState } from 'react'
import type { Appointment, Patient, Receipt } from './db'
import {
  getAppointmentsForPatient,
  getPatientById,
  getReceiptsForPatient,
  loadClinicData,
  nextId,
  queryAppointmentsByDate,
  queryAppointmentsWithPatient,
  queryPatients,
  saveClinicData,
} from './db'
import { sendWhatsAppReminder } from './whatsapp'
import { Sidebar, PALETTES, TRANSLATIONS } from './components'
import './App.css'

const REMINDER_HOURS = 12

function App() {
  const [patients, setPatients] = useState([] as Patient[])
  const [appointments, setAppointments] = useState([] as Appointment[])
  const [receipts, setReceipts] = useState([] as Receipt[])
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [showReceiptHistory, setShowReceiptHistory] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')

  const palette = Object.values(PALETTES)[0]
  const textDir = language === 'ar' ? 'rtl' : 'ltr'
  const t = TRANSLATIONS[language]

  useEffect(() => {
    const loaded = loadClinicData()
    setPatients(loaded.patients)
    setAppointments(loaded.appointments)
    setReceipts(loaded.receipts)
  }, [])

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    saveClinicData(patients, appointments, receipts)
  }, [patients, appointments, receipts])

  useEffect(() => {
    const soon = appointments.filter(
      (appointment) => appointment.notified === false && isWithinNextHours(appointment.datetime, REMINDER_HOURS),
    )
    if (soon.length === 0) return

    const next = soon[0]
    const patient = getPatientById(patients, next.patientId)
    if (!patient) return

    async function sendReminder() {
      let whatsappSent = false
      if (patient!.phone) {
        whatsappSent = await sendWhatsAppReminder(patient!.phone, patient!.name, next.datetime, language).catch(() => false)
      }

      const confirmationMessage = `A reminder was sent to ${patient!.name} for their appointment on ${formatLocalDate(next.datetime)}${whatsappSent ? ' via WhatsApp' : ''}.`
      setNotificationMessage(confirmationMessage)

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Reminder sent', { body: confirmationMessage })
      }

      setAppointments((current) =>
        current.map((appointment) =>
          soon.some((matched) => matched.id === appointment.id) ? { ...appointment, notified: true } : appointment,
        ),
      )
    }

    sendReminder()
  }, [appointments, patients])

  function addOrUpdatePatient(patient: any) {
    if (patient.id) {
      setPatients((current) => {
        const exists = current.some((existing) => existing.id === patient.id)
        if (exists) {
          return current.map((existing) => (existing.id === patient.id ? { ...existing, ...patient } : existing))
        }
        if (!patient.name || !patient.name.trim()) return current
        return [...current, patient]
      })
      return
    }
    if (!patient.name || !patient.name.trim()) return
    setPatients((current) => [...current, { ...patient, id: nextId(current) }])
  }

  function addOrUpdateAppointment(appointment: Appointment) {
    if (!appointment.patientId || !appointment.datetime.trim()) return
    if (appointment.id) {
      setAppointments((current) =>
        current.map((existing) => (existing.id === appointment.id ? { ...existing, ...appointment } : existing)),
      )
      return
    }
    setAppointments((current) => [...current, { ...appointment, id: nextId(current), notified: false }])
  }

  function addReceipt(receipt: Receipt) {
    if (!receipt.patientId) return
    setReceipts((current) => [...current, { ...receipt, id: nextId(current) }])
  }

  function openPatientHistory(patientId: number) {
    setSelectedPatientId(patientId)
    setCurrentView('patient-history')
  }

  function closePatientHistory() {
    setSelectedPatientId(null)
    setCurrentView('patients')
  }

  // Store functions for export to other components (to suppress unused warning)
  const handlers = { addOrUpdatePatient, addOrUpdateAppointment, addReceipt, openPatientHistory, closePatientHistory }

  const todayAppointments = useMemo(() => {
    const today = new Date()
    const dateKey = today.toISOString().split('T')[0]
    return queryAppointmentsByDate(appointments, patients, dateKey)
  }, [appointments, patients])

  return (
    <div dir={textDir} style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#F5F3F7', fontFamily: "'Inter', system-ui, sans-serif", color: '#2E2A3A' }}>
      <Sidebar
        isCompact={sidebarCompact}
        onToggleCompact={() => setSidebarCompact(!sidebarCompact)}
        currentView={currentView}
        onViewChange={setCurrentView}
        palette={palette}
        onLanguageToggle={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        language={language}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 40px', gap: '20px' }}>
          <div dir={textDir}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '26px', color: '#2E2A3A', letterSpacing: '-0.3px' }}>
              {currentView === 'dashboard' && t.welcomeDashboard}
              {currentView === 'appointments' && t.appointmentsHeading}
              {currentView === 'new-appointment' && t.newApptHeading}
              {currentView === 'receipt' && t.receiptHeading}
              {currentView === 'patients' && t.patientsHeading}
              {currentView === 'patient-history' && t.patientHistoryHeading}
            </div>
            <div style={{ fontSize: '14px', color: '#8A8398', marginTop: '3px' }}>
              {currentView === 'dashboard' && t.todaysOverview}
              {currentView === 'appointments' && t.appointmentsSubtitle}
              {currentView === 'new-appointment' && t.newApptSubtitle}
              {currentView === 'receipt' && t.receiptSubtitle}
              {currentView === 'patients' && t.patientsSubtitle}
              {currentView === 'patient-history' && t.patientHistorySubtitle}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {currentView === 'dashboard' && (
              <div onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '12px', padding: '4px', fontSize: '12.5px', fontWeight: 700 }}>
                <div style={{ padding: '6px 12px', borderRadius: '9px', background: language === 'en' ? palette.purple : 'transparent', color: language === 'en' ? '#FFFFFF' : '#8A8398' }}>EN</div>
                <div style={{ padding: '6px 12px', borderRadius: '9px', background: language === 'ar' ? palette.purple : 'transparent', color: language === 'ar' ? '#FFFFFF' : '#8A8398' }}>AR</div>
              </div>
            )}
            {currentView === 'receipt' && (
              <div
                onClick={() => setShowReceiptHistory(!showReceiptHistory)}
                title={t.receiptHistory}
                style={{ cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', background: showReceiptHistory ? palette.purple : '#FFFFFF', border: '1px solid #ECE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 1.5a6.5 6.5 0 1 0 4.6 1.9" fill="none" stroke="#8A8398" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M8 1.5v2.3h2.3" fill="none" stroke="#8A8398" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 5v3.3l2.4 1.4" fill="none" stroke="#8A8398" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            {currentView === 'patients' && (
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="7" cy="7" r="5" fill="none" stroke="#B7AFC9" strokeWidth="1.4" />
                  <path d="M11 11l3.5 3.5" stroke="#B7AFC9" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder={t.search}
                  style={{ width: '220px', boxSizing: 'border-box', border: '1px solid #ECE7F3', background: '#FFFFFF', borderRadius: '12px', padding: '10px 12px 10px 34px', fontSize: '13.5px', color: '#2E2A3A', fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            )}
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #ECE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 1.5c-2 0-3.3 1.6-3.3 3.6v2.6c0 .7-.3 1.4-.8 1.9l-.6.6h9.4l-.6-.6c-.5-.5-.8-1.2-.8-1.9V5.1C11.3 3.1 10 1.5 8 1.5z" fill="none" stroke="#8A8398" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M6.3 13c.3.7 1 1.1 1.7 1.1s1.4-.4 1.7-1.1" fill="none" stroke="#8A8398" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '8px', right: '9px', width: '7px', height: '7px', borderRadius: '50%', background: palette.pink, border: '1.5px solid #FFFFFF' }} />
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: palette.purple }} />
          </div>
        </div>

        {notificationMessage && (
          <div style={{ background: '#E8F5E9', borderLeft: `4px solid ${palette.purple}`, padding: '14px 20px', margin: '0 40px 20px 40px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#2E7D32', fontWeight: 500 }}>{notificationMessage}</span>
            <button onClick={() => setNotificationMessage('')} style={{ background: 'transparent', border: 'none', color: '#2E7D32', cursor: 'pointer', fontWeight: 600 }}>Dismiss</button>
          </div>
        )}

        {showReceiptHistory && currentView === 'receipt' && (
          <div style={{ margin: '0 40px 20px 40px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px' }}>{t.receiptHistory}</div>
              <button onClick={() => setShowReceiptHistory(false)} style={{ background: 'transparent', border: 'none', color: '#8A8398', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>{t.close}</button>
            </div>
            {receipts.length === 0 ? (
              <div style={{ fontSize: '13.5px', color: '#B7AFC9' }}>{t.noReceiptsYet}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...receipts].reverse().map((receipt) => {
                  const patient = getPatientById(patients, receipt.patientId)
                  return (
                    <div key={receipt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', background: '#FAF9FC' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#2E2A3A' }}>{patient ? patient.name : t.patient}</div>
                        <div style={{ fontSize: '12px', color: '#8A8398' }}>
                          {receipt.teeth.length > 0 ? `${t.teethLabelPrefix}: ${receipt.teeth.join(', ')}` : t.noTeethMarked} · {receipt.createdAt}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#5C3FA0', fontFamily: "'Manrope', sans-serif" }}>{receipt.cost}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: '0 40px 40px', overflowY: 'auto' }}>
          {currentView === 'dashboard' && <DashboardView appointments={todayAppointments} allAppointments={appointments} patients={patients} palette={palette} onViewChange={setCurrentView} t={t} />}
          {currentView === 'appointments' && (
            <AppointmentsView appointments={appointments} patients={patients} palette={palette} t={t} />
          )}
          {currentView === 'new-appointment' && (
            <NewAppointmentView handlers={handlers} patients={patients} palette={palette} t={t} />
          )}
          {currentView === 'receipt' && (
            <ReceiptView handlers={handlers} patients={patients} palette={palette} t={t} />
          )}
          {currentView === 'patients' && (
            <PatientsView patients={patients} receipts={receipts} appointments={appointments} searchQuery={patientSearch} handlers={handlers} palette={palette} t={t} />
          )}
          {currentView === 'patient-history' && selectedPatientId != null && (
            <PatientHistoryView
              patient={getPatientById(patients, selectedPatientId)}
              receipts={getReceiptsForPatient(receipts, selectedPatientId)}
              appointments={getAppointmentsForPatient(appointments, selectedPatientId)}
              onBack={handlers.closePatientHistory}
              palette={palette}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardView({ appointments, allAppointments, patients, palette, onViewChange, t }: { appointments: any[]; allAppointments: Appointment[]; patients: any[]; palette: typeof PALETTES.lavender; onViewChange: (view: string) => void; t: any }) {
  const today = new Date()
  const totalToday = appointments.length
  // "Completed" is derived, not a stored status: a Confirmed appointment
  // counts as completed once its scheduled hour has passed. Unconfirmed
  // (Pending/Cancelled) appointments never count toward the rate.
  const confirmedToday = appointments.filter((a) => a.status === 'Confirmed')
  const completed = confirmedToday.filter((a) => new Date(a.datetime).getTime() <= today.getTime()).length
  const pending = appointments.filter((a) => a.status === 'Pending').length
  const cancelled = appointments.filter((a) => a.status === 'Cancelled').length

  // Real day-over-day comparison, computed from the full appointment list
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().split('T')[0]
  const totalYesterday = allAppointments.filter((a) => a.datetime.startsWith(yesterdayKey)).length
  const dayOverDayDiff = totalToday - totalYesterday
  const dayOverDayText =
    dayOverDayDiff === 0
      ? t.sameAsYesterday
      : `${dayOverDayDiff > 0 ? '+' : ''}${dayOverDayDiff} ${t.fromYesterdaySuffix}`

  // Real completion rate: passed Confirmed appointments over all Confirmed appointments today
  const successRateText = `${confirmedToday.length > 0 ? Math.round((completed / confirmedToday.length) * 100) : 0}% ${t.successRate}`

  // Real weekly appointment counts, computed from the full appointment list
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const startOfWeek = new Date(today)
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  startOfWeek.setDate(today.getDate() + mondayOffset)
  startOfWeek.setHours(0, 0, 0, 0)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const weekData = weekDates.map((dateKey) => allAppointments.filter((a) => a.datetime.startsWith(dateKey)).length)
  const maxWeek = Math.max(1, ...weekData)

  // Next appointments (upcoming today not yet done)
  const upcoming = appointments.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled').slice(0, 3)

  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Left column – main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stat cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: t.todaysAppointments, value: totalToday, sub: dayOverDayText, bg: palette.blue, tc: '#3E6C96', icon: '📅' },
            { label: t.completed, value: completed, sub: successRateText, bg: palette.pink, tc: '#8C3F63', icon: '✓' },
            { label: t.pending, value: pending, sub: pending > 0 ? t.actionNeeded : t.allClear, bg: palette.purple, tc: '#5C3FA0', icon: '⏳' },
          ].map((card, i) => (
            <div key={i} style={{ background: card.bg, borderRadius: '20px', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '16px', right: '18px', fontSize: '22px', opacity: 0.25 }}>{card.icon}</div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: card.tc, opacity: 0.8, letterSpacing: '0.01em' }}>{card.label.toUpperCase()}</div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: '38px', fontWeight: 800, color: card.tc, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: card.tc, opacity: 0.6 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Weekly activity chart */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: '#2E2A3A' }}>{t.weeklyAppointments}</div>
              <div style={{ fontSize: '12px', color: '#8A8398', marginTop: '2px' }}>{t.activityThisWeek}</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#7C5CBF', background: palette.purple, padding: '5px 12px', borderRadius: '20px' }}>{t.thisWeek}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '90px' }}>
            {weekDays.map((day, i) => {
              const height = (weekData[i] / maxWeek) * 70
              const isToday = i === (today.getDay() === 0 ? 6 : today.getDay() - 1)
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '100%',
                    height: `${height}px`,
                    borderRadius: '8px 8px 0 0',
                    background: isToday ? '#7C5CBF' : palette.blue,
                    transition: 'height 0.3s ease',
                    opacity: isToday ? 1 : 0.7,
                  }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isToday ? '#7C5CBF' : '#8A8398' }}>{day}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Today's Schedule */}
        <div style={{ background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '15px', color: '#2E2A3A' }}>{t.todaysSchedule}</div>
              <div style={{ fontSize: '12px', color: '#8A8398', marginTop: '2px' }}>{todayStr}</div>
            </div>
            <button onClick={() => onViewChange('appointments')} style={{ fontSize: '12.5px', fontWeight: 600, color: '#7C5CBF', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>{t.viewAll}</button>
          </div>
          {appointments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '10px' }}>
              <div style={{ fontSize: '36px' }}>📭</div>
              <div style={{ fontSize: '14px', color: '#8A8398', fontWeight: 500 }}>{t.noApptToday}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(0, 5).map((appt, i) => {
                const initials = (appt.patientName || appt.patient || 'PT').substring(0, 2).toUpperCase()
                const avatarColors = [palette.blue, palette.pink, palette.purple, '#E8F4FD', '#FDE8F4']
                const textColors = ['#3E6C96', '#8C3F63', '#5C3FA0', '#2E6B9A', '#8B3060']
                const statusColor = appt.status === 'Completed' ? { bg: '#D4EDDA', text: '#155724' }
                  : appt.status === 'Cancelled' ? { bg: '#F8D7DA', text: '#721C24' }
                  : { bg: '#FFF3CD', text: '#856404' }
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', borderRadius: '14px', background: '#FAF9FC', transition: 'background 0.15s' }}>
                    <div style={{ width: '46px', flex: 'none', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A8398' }}>
                        {new Date(appt.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: avatarColors[i % 5], flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: textColors[i % 5], fontFamily: "'Manrope', sans-serif" }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#2E2A3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.patientName || appt.patient || t.appointment}</div>
                      <div style={{ fontSize: '12px', color: '#8A8398', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.reason || t.generalCheckup}</div>
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px', background: statusColor.bg, color: statusColor.text, flex: 'none' }}>
                      {appt.status || 'Confirmed'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right column – info panels */}
      <div style={{ width: '280px', flex: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Quick stats summary (blue card) */}
        <div style={{ background: palette.blue, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14.5px', color: '#3E6C96' }}>{t.atAGlance}</div>
          {[
            { label: t.totalPatients, value: patients.length, icon: '👤' },
            { label: t.cancelledToday, value: cancelled, icon: '✕' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.45)', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#3E6C96' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#3E6C96', fontFamily: "'Manrope', sans-serif" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Upcoming appointments (pink card) */}
        <div style={{ background: palette.pink, borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '14.5px', color: '#8C3F63' }}>{t.upcomingLabel}</div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: '#8C3F63', opacity: 0.7, textAlign: 'center', padding: '12px 0' }}>{t.noUpcoming}</div>
          ) : (
            upcoming.map((appt, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.45)', borderRadius: '12px', padding: '11px 14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#8C3F63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {appt.patientName || appt.patient || t.patient}
                </div>
                <div style={{ fontSize: '11.5px', color: '#8C3F63', opacity: 0.75, marginTop: '2px' }}>
                  {new Date(appt.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {appt.reason ? ` · ${appt.reason}` : ''}
                </div>
              </div>
            ))
          )}
          {upcoming.length === 0 && (
            <>
              {[{ name: 'No upcoming visits', time: '—' }].map((_, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.45)', borderRadius: '12px', padding: '11px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12.5px', color: '#8C3F63', opacity: 0.6 }}>{t.scheduleClear}</div>
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function AppointmentsView({
  appointments,
  patients,
  palette,
  t,
}: {
  appointments: Appointment[]
  patients: Patient[]
  palette: typeof PALETTES.lavender
  t: any
}): React.ReactElement {
  const allWithPatient = useMemo(() => queryAppointmentsWithPatient(appointments, patients), [appointments, patients])

  const weekDates = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [])

  const [activeDay, setActiveDay] = useState(() => new Date().getDay())
  const activeDateKey = weekDates[activeDay].toISOString().split('T')[0]

  const dayAppointments = allWithPatient.filter((appt) => appt.datetime.startsWith(activeDateKey))

  const avatarColors = [palette.blue, palette.pink, palette.purple]
  const textColors = ['#3E6C96', '#8C3F63', '#5C3FA0']

  const statusStyle = (status?: string) => {
    if (status === 'Completed') return { bg: '#D4EDDA', text: '#155724', label: t.statusCompleted }
    if (status === 'Cancelled') return { bg: '#F8D7DA', text: '#721C24', label: t.statusCancelled }
    if (status === 'Pending') return { bg: palette.pink, text: '#8C3F63', label: t.statusPending }
    return { bg: palette.blue, text: '#2E5878', label: t.statusConfirmed }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {weekDates.map((date, i) => {
          const isActive = i === activeDay
          return (
            <div
              key={i}
              onClick={() => setActiveDay(i)}
              style={{
                cursor: 'pointer',
                width: '64px',
                padding: '12px 0',
                borderRadius: '14px',
                textAlign: 'center',
                background: isActive ? palette.purple : '#FFFFFF',
                border: isActive ? 'none' : '1px solid #ECE7F3',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#42306E' : '#8A8398' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: isActive ? '#42306E' : '#2E2A3A', fontFamily: "'Manrope', sans-serif" }}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '20px', padding: '24px' }}>
        {dayAppointments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '10px' }}>
            <div style={{ fontSize: '36px' }}>📭</div>
            <div style={{ fontSize: '14px', color: '#8A8398', fontWeight: 500 }}>{t.noAppointmentsListed}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayAppointments.map((appt, i) => {
              const initials = (appt.patientName || 'PT').substring(0, 2).toUpperCase()
              const status = statusStyle(appt.status)
              return (
                <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', borderRadius: '14px', background: '#FAF9FC' }}>
                  <div style={{ width: '52px', flex: 'none', fontSize: '13px', fontWeight: 700, color: '#8A8398' }}>
                    {new Date(appt.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: avatarColors[i % 3], flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: textColors[i % 3], fontFamily: "'Manrope', sans-serif" }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2A3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.patientName || t.patient}</div>
                    <div style={{ fontSize: '12.5px', color: '#8A8398', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.reason || t.generalCheckup}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: status.bg, color: status.text, flex: 'none' }}>
                    {status.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function NewAppointmentView({
  handlers,
  patients,
  palette,
  t,
}: {
  handlers: any
  patients: Patient[]
  palette: typeof PALETTES.lavender
  t: any
}): React.ReactElement {
  const [form, setForm] = useState({
    patient: '',
    age: '',
    phone: '',
    guardian: '',
    dentalInsurance: 'no',
    medicalInsurance: 'no',
    anesthesia: 'None',
    medicalHistory: '',
    specialNeeds: '',
    date: '',
    time: '10:00',
    type: 'Cleaning',
    duration: '30 min',
    notes: '',
    isOrthodontic: false,
  })
  const [scheduledList, setScheduledList] = useState<any[]>([])

  function updateField(field: string, value: any) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handlePatientNameBlur() {
    const match = patients.find((p) => p.name.trim().toLowerCase() === form.patient.trim().toLowerCase())
    if (!match) return
    setForm((current) => ({
      ...current,
      phone: match.phone || current.phone,
      age: match.age ? String(match.age) : current.age,
      guardian: match.guardian || current.guardian,
      dentalInsurance: match.dentalInsurance === 'yes' ? 'yes' : 'no',
      medicalInsurance: match.medicalInsurance === 'yes' ? 'yes' : 'no',
      anesthesia: match.anesthesia || current.anesthesia,
      medicalHistory: match.medicalHistory || current.medicalHistory,
      specialNeeds: match.specialNeeds || current.specialNeeds,
    }))
  }

  function handleSchedule() {
    if (!form.patient.trim() || !form.date || !form.time) return

    let patientId: number
    const existing = patients.find(
      (p) =>
        p.name.trim().toLowerCase() === form.patient.trim().toLowerCase() &&
        (!form.phone || p.phone === form.phone),
    )

    const patientPayload = {
      name: form.patient.trim(),
      phone: form.phone,
      age: form.age ? Number(form.age) : undefined,
      guardian: form.guardian,
      dentalInsurance: form.dentalInsurance,
      medicalInsurance: form.medicalInsurance,
      anesthesia: form.anesthesia,
      nextAppointment: `${form.date}T${form.time}`,
      medicalHistory: form.medicalHistory,
      specialNeeds: form.specialNeeds,
    }

    if (existing) {
      patientId = existing.id
      handlers.addOrUpdatePatient({ id: patientId, ...patientPayload })
    } else {
      patientId = nextId(patients)
      handlers.addOrUpdatePatient({
        id: patientId,
        ...patientPayload,
        email: '',
        address: '',
        insurance: '',
        receipt: '',
      })
    }

    handlers.addOrUpdateAppointment({
      id: 0,
      patientId,
      datetime: `${form.date}T${form.time}`,
      reason: form.type,
      notes: form.notes,
      teeth: [],
      receipt: '',
      notified: false,
      status: 'Confirmed',
    })

    setScheduledList((current) => [
      {
        patient: form.patient,
        phone: form.phone,
        type: form.type,
        duration: form.duration,
        date: form.date,
        time: form.time,
        isOrthodontic: form.isOrthodontic,
      },
      ...current,
    ])

    setForm({
      patient: '',
      age: '',
      phone: '',
      guardian: '',
      dentalInsurance: 'no',
      medicalInsurance: 'no',
      anesthesia: 'None',
      medicalHistory: '',
      specialNeeds: '',
      date: '',
      time: '10:00',
      type: 'Cleaning',
      duration: '30 min',
      notes: '',
      isOrthodontic: false,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ECE7F3',
    background: '#FAF9FC',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13.5px',
    color: '#2E2A3A',
    fontFamily: "'Inter', sans-serif",
  }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#8A8398', marginBottom: '6px' }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ flex: '1 1 420px', minWidth: '320px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px' }}>{t.patientDetails}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={labelStyle}>{t.patientName}</div>
            <input
              type="text"
              value={form.patient}
              onChange={(e) => updateField('patient', e.target.value)}
              onBlur={handlePatientNameBlur}
              placeholder="e.g. Amelia Cross"
              list="known-patients"
              style={inputStyle}
            />
            <datalist id="known-patients">
              {patients.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <div>
            <div style={labelStyle}>{t.age}</div>
            <input type="number" value={form.age} onChange={(e) => updateField('age', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.phoneNumber}</div>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. +1 (555) 214-7788"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>
              {t.guardian} <span style={{ color: '#B7AFC9', fontWeight: 500 }}>{t.ifMinor}</span>
            </div>
            <input type="text" value={form.guardian} onChange={(e) => updateField('guardian', e.target.value)} placeholder="—" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.dentalInsurance}</div>
            <select value={form.dentalInsurance} onChange={(e) => updateField('dentalInsurance', e.target.value)} style={inputStyle}>
              <option value="no">{t.noInsurance}</option>
              <option value="yes">{t.hasInsurance}</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>{t.medicalInsurance}</div>
            <select value={form.medicalInsurance} onChange={(e) => updateField('medicalInsurance', e.target.value)} style={inputStyle}>
              <option value="no">{t.noInsurance}</option>
              <option value="yes">{t.hasInsurance}</option>
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={labelStyle}>{t.anesthesia}</div>
            <select value={form.anesthesia} onChange={(e) => updateField('anesthesia', e.target.value)} style={inputStyle}>
              {['None', 'Local', 'Sedation', 'General'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={labelStyle}>{t.medicalHistory}</div>
          <textarea rows={2} value={form.medicalHistory} onChange={(e) => updateField('medicalHistory', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div>
          <div style={labelStyle}>{t.specialNeeds}</div>
          <textarea rows={2} value={form.specialNeeds} onChange={(e) => updateField('specialNeeds', e.target.value)} placeholder="—" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ paddingTop: '4px', borderTop: '1px solid #F1EDF8', fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px' }}>{t.scheduleAVisit}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={labelStyle}>{t.date}</div>
            <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.time}</div>
            <input type="time" value={form.time} onChange={(e) => updateField('time', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.type}</div>
            <select value={form.type} onChange={(e) => updateField('type', e.target.value)} style={inputStyle}>
              {['Cleaning', 'Consultation', 'Filling', 'Root Canal', 'Whitening', 'Checkup'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={labelStyle}>{t.duration}</div>
            <select value={form.duration} onChange={(e) => updateField('duration', e.target.value)} style={inputStyle}>
              {['15 min', '30 min', '45 min', '60 min', '90 min'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={labelStyle}>{t.notes}</div>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Anything to flag for this visit…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div
          onClick={() => updateField('isOrthodontic', !form.isOrthodontic)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: '#FAF9FC', border: '1px solid #ECE7F3' }}
        >
          <input
            type="checkbox"
            checked={form.isOrthodontic}
            onChange={() => updateField('isOrthodontic', !form.isOrthodontic)}
            style={{ width: '17px', height: '17px', accentColor: '#7C5CBF' }}
          />
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#2E2A3A' }}>{t.orthodonticCheckbox}</div>
        </div>

        <div
          onClick={handleSchedule}
          style={{
            cursor: form.patient.trim() && form.date && form.time ? 'pointer' : 'not-allowed',
            opacity: form.patient.trim() && form.date && form.time ? 1 : 0.5,
            alignSelf: 'flex-start',
            background: palette.purple,
            color: '#42306E',
            fontWeight: 700,
            fontSize: '14px',
            padding: '11px 22px',
            borderRadius: '12px',
          }}
        >
          {t.scheduleAppointmentBtn}
        </div>
      </div>

      <div style={{ flex: '1 1 360px', minWidth: '280px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '24px' }}>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>{t.justScheduled}</div>
        {scheduledList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scheduledList.map((sa, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: '14px', background: '#FAF9FC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2A3A' }}>{sa.patient}</div>
                  {sa.isOrthodontic && (
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#8C3F63', background: '#F0D9E8', padding: '2px 8px', borderRadius: '20px' }}>
                      {t.orthoTag}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: '#8A8398', marginTop: '2px' }}>{sa.phone}</div>
                <div style={{ fontSize: '12.5px', color: '#8A8398' }}>{sa.type} · {sa.duration}</div>
                <div style={{ fontSize: '12.5px', color: '#8A8398' }}>{sa.date} at {sa.time}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '13.5px', color: '#B7AFC9' }}>{t.noAppointmentsYet}</div>
        )}
      </div>
    </div>
  )
}

const PERMANENT_TOP = Array.from({ length: 16 }, (_, i) => `${i + 1}`)
const PERMANENT_BOTTOM = Array.from({ length: 16 }, (_, i) => `${32 - i}`)
const PRIMARY_TOP = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const PRIMARY_BOTTOM = ['T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K']

function ReceiptView({
  handlers,
  patients,
  palette,
  t,
}: {
  handlers: any
  patients: Patient[]
  palette: typeof PALETTES.lavender
  t: any
}): React.ReactElement {
  const [patientId, setPatientId] = useState<number | ''>('')
  const [details, setDetails] = useState({
    age: '',
    phone: '',
    guardian: '',
    dentalInsurance: 'no',
    medicalInsurance: 'no',
    anesthesia: 'None',
    nextAppointment: '',
    medicalHistory: '',
    specialNeeds: '',
  })
  const [procedure, setProcedure] = useState('Cleaning')
  const [selectedTeeth, setSelectedTeeth] = useState<Record<string, boolean>>({})
  const [prescription, setPrescription] = useState('')
  const [xray, setXray] = useState('')
  const [dentistNote, setDentistNote] = useState('')
  const [cost, setCost] = useState('$0.00')
  const [confirmedMessage, setConfirmedMessage] = useState('')

  const selectedPatient = patients.find((p) => p.id === patientId)

  function handleSelectPatient(id: number | '') {
    setPatientId(id)
    const p = patients.find((patient) => patient.id === id)
    setDetails({
      age: p?.age ? String(p.age) : '',
      phone: p?.phone || '',
      guardian: p?.guardian || '',
      dentalInsurance: p?.dentalInsurance === 'yes' ? 'yes' : 'no',
      medicalInsurance: p?.medicalInsurance === 'yes' ? 'yes' : 'no',
      anesthesia: p?.anesthesia || 'None',
      nextAppointment: p?.nextAppointment || '',
      medicalHistory: p?.medicalHistory || '',
      specialNeeds: p?.specialNeeds || '',
    })
  }

  function updateDetail(field: string, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  function toggleTooth(id: string) {
    setSelectedTeeth((current) => ({ ...current, [id]: !current[id] }))
  }

  function handleXrayUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setXray(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  function handleConfirm() {
    if (!patientId) return
    const teethIds = Object.keys(selectedTeeth).filter((id) => selectedTeeth[id])

    handlers.addReceipt({
      id: 0,
      patientId,
      procedure,
      teeth: teethIds,
      prescription,
      xray,
      dentistNote,
      cost,
      createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    })

    handlers.addOrUpdatePatient({
      id: patientId,
      age: details.age ? Number(details.age) : undefined,
      phone: details.phone,
      guardian: details.guardian,
      dentalInsurance: details.dentalInsurance,
      medicalInsurance: details.medicalInsurance,
      anesthesia: details.anesthesia,
      nextAppointment: details.nextAppointment,
      medicalHistory: details.medicalHistory,
      specialNeeds: details.specialNeeds,
      ...(xray ? { xray } : {}),
    })

    setConfirmedMessage(t.confirmReceipt + ' ✓')
    setSelectedTeeth({})
    setPrescription('')
    setXray('')
    setDentistNote('')
    setCost('$0.00')
    setTimeout(() => setConfirmedMessage(''), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ECE7F3',
    background: '#FAF9FC',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13.5px',
    color: '#2E2A3A',
    fontFamily: "'Inter', sans-serif",
  }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#8A8398', marginBottom: '6px' }

  const selectedIds = Object.keys(selectedTeeth).filter((id) => selectedTeeth[id])

  const toothStyle = (id: string) => {
    const isSelected = !!selectedTeeth[id]
    return {
      selectedBg: isSelected ? palette.blue : 'transparent',
      stroke: isSelected ? '#2E5878' : '#B7AFC9',
      numColor: isSelected ? '#2E5878' : '#8A8398',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '24px', maxWidth: '640px' }}>
      {confirmedMessage && (
        <div style={{ background: '#D4EDDA', color: '#155724', fontWeight: 600, fontSize: '13.5px', padding: '10px 14px', borderRadius: '10px' }}>{confirmedMessage}</div>
      )}

      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{t.patientDetails}</div>

      <div>
        <div style={labelStyle}>{t.patientName}</div>
        <select value={patientId} onChange={(e) => handleSelectPatient(e.target.value ? Number(e.target.value) : '')} style={inputStyle}>
          <option value="">{t.choosePatientPlaceholder}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={labelStyle}>{t.age}</div>
            <input type="number" value={details.age} onChange={(e) => updateDetail('age', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.phoneNumber}</div>
            <input type="tel" value={details.phone} onChange={(e) => updateDetail('phone', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>
              {t.guardian} <span style={{ color: '#B7AFC9', fontWeight: 500 }}>{t.ifMinor}</span>
            </div>
            <input type="text" value={details.guardian} onChange={(e) => updateDetail('guardian', e.target.value)} placeholder="—" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>{t.dentalInsurance}</div>
            <select value={details.dentalInsurance} onChange={(e) => updateDetail('dentalInsurance', e.target.value)} style={inputStyle}>
              <option value="yes">{t.hasInsurance}</option>
              <option value="no">{t.noInsurance}</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>{t.medicalInsurance}</div>
            <select value={details.medicalInsurance} onChange={(e) => updateDetail('medicalInsurance', e.target.value)} style={inputStyle}>
              <option value="yes">{t.hasInsurance}</option>
              <option value="no">{t.noInsurance}</option>
            </select>
          </div>
          <div>
            <div style={labelStyle}>{t.anesthesia}</div>
            <select value={details.anesthesia} onChange={(e) => updateDetail('anesthesia', e.target.value)} style={inputStyle}>
              {['None', 'Local', 'Sedation', 'General'].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={labelStyle}>{t.nextAppointment}</div>
            <input type="date" value={details.nextAppointment} onChange={(e) => updateDetail('nextAppointment', e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}

      {selectedPatient && (
        <div>
          <div style={labelStyle}>{t.medicalHistory}</div>
          <textarea rows={2} value={details.medicalHistory} onChange={(e) => updateDetail('medicalHistory', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}

      {selectedPatient && (
        <div>
          <div style={labelStyle}>{t.specialNeeds}</div>
          <textarea rows={2} value={details.specialNeeds} onChange={(e) => updateDetail('specialNeeds', e.target.value)} placeholder="—" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      )}

      <div>
        <div style={labelStyle}>{t.procedure}</div>
        <select value={procedure} onChange={(e) => setProcedure(e.target.value)} style={inputStyle}>
          {['Cleaning', 'Consultation', 'Filling', 'Root Canal', 'Whitening', 'Checkup'].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px' }}>{t.teethChart}</div>
        <div style={{ fontSize: '12.5px', color: '#8A8398' }}>{t.clickTeethHint}</div>
      </div>

      <div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#5B5568', marginBottom: '8px' }}>{t.permanentTeeth}</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PERMANENT_TOP.map((id) => {
            const s = toothStyle(id)
            return (
              <div key={id} onClick={() => toggleTooth(id)} style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 2px', borderRadius: '8px', background: s.selectedBg }}>
                <svg width="20" height="22" viewBox="0 0 20 22">
                  <path d="M4 3 C4 1 6 0.5 8 1.5 C9 2 10 2 11 1.5 C13 0.5 16 1 16 3 C16 5 16.5 8 15.5 12 C15 15 14 20 12.5 20 C11.5 20 11 15 10 15 C9 15 8.5 20 7.5 20 C6 20 5 15 4.5 12 C3.5 8 4 5 4 3 Z" fill="none" stroke={s.stroke} strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.numColor }}>{id}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {PERMANENT_BOTTOM.map((id) => {
            const s = toothStyle(id)
            return (
              <div key={id} onClick={() => toggleTooth(id)} style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 2px', borderRadius: '8px', background: s.selectedBg }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.numColor }}>{id}</div>
                <svg width="20" height="22" viewBox="0 0 20 22">
                  <path d="M4 19 C4 21 6 21.5 8 20.5 C9 20 10 20 11 20.5 C13 21.5 16 21 16 19 C16 17 16.5 14 15.5 10 C15 7 14 2 12.5 2 C11.5 2 11 7 10 7 C9 7 8.5 2 7.5 2 C6 2 5 7 4.5 10 C3.5 14 4 17 4 19 Z" fill="none" stroke={s.stroke} strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#5B5568', marginBottom: '8px' }}>{t.primaryTeeth}</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PRIMARY_TOP.map((id) => {
            const s = toothStyle(id)
            return (
              <div key={id} onClick={() => toggleTooth(id)} style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 2px', borderRadius: '8px', background: s.selectedBg }}>
                <svg width="17" height="19" viewBox="0 0 20 22">
                  <path d="M4 3 C4 1 6 0.5 8 1.5 C9 2 10 2 11 1.5 C13 0.5 16 1 16 3 C16 5 16.5 8 15.5 12 C15 15 14 20 12.5 20 C11.5 20 11 15 10 15 C9 15 8.5 20 7.5 20 C6 20 5 15 4.5 12 C3.5 8 4 5 4 3 Z" fill="none" stroke={s.stroke} strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.numColor }}>{id}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {PRIMARY_BOTTOM.map((id) => {
            const s = toothStyle(id)
            return (
              <div key={id} onClick={() => toggleTooth(id)} style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 2px', borderRadius: '8px', background: s.selectedBg }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.numColor }}>{id}</div>
                <svg width="17" height="19" viewBox="0 0 20 22">
                  <path d="M4 19 C4 21 6 21.5 8 20.5 C9 20 10 20 11 20.5 C13 21.5 16 21 16 19 C16 17 16.5 14 15.5 10 C15 7 14 2 12.5 2 C11.5 2 11 7 10 7 C9 7 8.5 2 7.5 2 C6 2 5 7 4.5 10 C3.5 14 4 17 4 19 Z" fill="none" stroke={s.stroke} strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ paddingTop: '6px', borderTop: '1px solid #F1EDF8' }}>
        <div style={labelStyle}>{t.selectedTeeth}</div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#2E2A3A' }}>
          {selectedIds.length > 0 ? selectedIds.join(', ') : t.noTeethMarked}
        </div>
      </div>

      <div>
        <div style={labelStyle}>{t.prescription}</div>
        <textarea rows={3} value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="e.g. Amoxicillin 500mg, 3x daily for 7 days" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div>
        <div style={labelStyle}>{t.xray}</div>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '220px', height: '165px', borderRadius: '14px', border: '1.5px dashed #D9D2E8', background: '#FAF9FC', overflow: 'hidden' }}>
          {xray ? (
            <img src={xray} alt="X-ray" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '12.5px', color: '#B7AFC9', textAlign: 'center', padding: '0 12px' }}>{t.uploadXray}</span>
          )}
          <input type="file" accept="image/*" onChange={handleXrayUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div>
        <div style={labelStyle}>{t.dentistNote}</div>
        <textarea rows={3} value={dentistNote} onChange={(e) => setDentistNote(e.target.value)} placeholder="Notes from today's visit…" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div>
        <div style={labelStyle}>{t.cost}</div>
        <input type="text" value={cost} onChange={(e) => setCost(e.target.value)} style={{ ...inputStyle, width: '180px', fontSize: '14.5px', fontWeight: 700, fontFamily: "'Manrope', sans-serif" }} />
      </div>

      <div
        onClick={handleConfirm}
        style={{
          cursor: patientId ? 'pointer' : 'not-allowed',
          opacity: patientId ? 1 : 0.5,
          alignSelf: 'flex-start',
          background: palette.purple,
          color: '#42306E',
          fontWeight: 700,
          fontSize: '14px',
          padding: '11px 22px',
          borderRadius: '12px',
        }}
      >
        {t.confirmReceipt}
      </div>
    </div>
  )
}

function PatientsView({
  patients,
  receipts,
  appointments,
  searchQuery,
  handlers,
  palette,
  t,
}: {
  patients: Patient[]
  receipts: Receipt[]
  appointments: Appointment[]
  searchQuery: string
  handlers: any
  palette: typeof PALETTES.lavender
  t: any
}): React.ReactElement {
  const avatarColors = [palette.purple, palette.blue, palette.pink]
  const statusStyle = (status?: string) => {
    if (status === 'Follow-up') return { bg: palette.pink, text: '#8C3F63', label: t.statusFollowUp }
    if (status === 'Inactive') return { bg: '#EFEDF3', text: '#6B6578', label: t.statusInactive }
    return { bg: palette.blue, text: '#2E5878', label: t.statusActive }
  }

  function getLastVisit(patientId: number) {
    const patientReceipts = receipts.filter((r) => r.patientId === patientId)
    if (patientReceipts.length > 0) {
      const latest = patientReceipts.reduce((a, b) => (a.id > b.id ? a : b))
      return latest.createdAt.split(',')[0]
    }
    const now = new Date()
    const pastAppts = appointments.filter((a) => a.patientId === patientId && new Date(a.datetime) <= now)
    if (pastAppts.length > 0) {
      const latest = pastAppts.reduce((a, b) => (new Date(a.datetime) > new Date(b.datetime) ? a : b))
      return new Date(latest.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return '—'
  }

  function getNextVisit(patient: Patient) {
    if (!patient.nextAppointment) return '—'
    const d = new Date(patient.nextAppointment)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const visiblePatients = searchQuery.trim() ? queryPatients(patients, searchQuery) : patients

  if (patients.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '20px' }}>
        <div style={{ fontSize: '36px' }}>🧑‍⚕️</div>
        <div style={{ fontSize: '14px', color: '#8A8398', fontWeight: 500 }}>{t.noPatientsYet}</div>
      </div>
    )
  }

  if (visiblePatients.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '20px' }}>
        <div style={{ fontSize: '36px' }}>🔍</div>
        <div style={{ fontSize: '14px', color: '#8A8398', fontWeight: 500 }}>{t.noAppointmentsListed}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {visiblePatients.map((p, i) => {
        const status = statusStyle(p.status)
        const initials = p.name.substring(0, 2).toUpperCase() || 'PT'
        return (
          <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: avatarColors[i % 3], flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13.5px', color: '#5C3FA0', fontFamily: "'Manrope', sans-serif" }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15.5px', fontWeight: 700, color: '#2E2A3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: '12.5px', color: '#8A8398' }}>{p.phone}</div>
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: status.bg, color: status.text, flex: 'none' }}>{status.label}</div>
              <div
                onClick={() => handlers.openPatientHistory(p.id)}
                style={{ cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, padding: '9px 16px', borderRadius: '12px', background: '#FAF9FC', border: '1px solid #ECE7F3', color: '#5C3FA0', flex: 'none' }}
              >
                {t.prescriptionBtn}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B7AFC9', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>{t.age}</div>
                <div style={{ fontSize: '13.5px', color: '#2E2A3A' }}>{p.age || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B7AFC9', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>{t.lastVisit}</div>
                <div style={{ fontSize: '13.5px', color: '#2E2A3A' }}>{getLastVisit(p.id)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B7AFC9', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>{t.nextVisit}</div>
                <div style={{ fontSize: '13.5px', color: '#2E2A3A' }}>{getNextVisit(p)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B7AFC9', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>{t.guardian}</div>
                <div style={{ fontSize: '13.5px', color: '#2E2A3A' }}>{p.guardian || '—'}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#B7AFC9', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '4px' }}>{t.medicalHistory}</div>
              <div style={{ fontSize: '13.5px', color: '#2E2A3A' }}>{p.medicalHistory || '—'}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PatientHistoryView({
  patient,
  receipts,
  appointments,
  onBack,
  palette,
  t,
}: {
  patient: Patient | undefined
  receipts: Receipt[]
  appointments: Appointment[]
  onBack: () => void
  palette: typeof PALETTES.lavender
  t: any
}): React.ReactElement {
  if (!patient) {
    return <div style={{ color: '#8A8398', padding: '20px', textAlign: 'center' }}>{t.patient}</div>
  }

  const initials = patient.name.substring(0, 2).toUpperCase() || 'PT'
  const xrays = receipts.filter((r) => r.xray)
  const medications = receipts.filter((r) => r.prescription.trim())
  const treatments = receipts.length > 0
    ? receipts.map((r) => ({ procedure: r.procedure, date: r.createdAt, notes: r.dentistNote }))
    : appointments.map((a) => ({ procedure: a.reason, date: a.datetime, notes: a.notes }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div onClick={onBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#8A8398', width: 'fit-content' }}>
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path d="M9.5 2.5 L4 7.5 L9.5 12.5" fill="none" stroke="#8A8398" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t.backToPatients}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '20px 22px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: palette.purple, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#5C3FA0', fontFamily: "'Manrope', sans-serif" }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#2E2A3A' }}>{patient.name}</div>
          <div style={{ fontSize: '12.5px', color: '#8A8398' }}>{patient.phone}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: '1 1 360px', minWidth: '300px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '22px' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>{t.medicationsGiven}</div>
          {medications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medications.map((rx) => {
                const [medName, ...rest] = rx.prescription.split(',')
                const dosage = rest.join(',').trim()
                return (
                  <div key={rx.id} style={{ padding: '12px 14px', borderRadius: '14px', background: '#FAF9FC' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2A3A' }}>{medName.trim()}</div>
                    {dosage && <div style={{ fontSize: '12.5px', color: '#8A8398', marginTop: '2px' }}>{dosage}</div>}
                    <div style={{ fontSize: '11.5px', color: '#B7AFC9', marginTop: '2px' }}>{rx.createdAt}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: '13.5px', color: '#B7AFC9' }}>{t.noMedications}</div>
          )}
        </div>

        <div style={{ flex: '1 1 360px', minWidth: '300px', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '22px' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>{t.treatmentHistoryLabel}</div>
          {treatments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {treatments.map((th, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: '14px', background: '#FAF9FC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2A3A' }}>{th.procedure || t.generalCheckup}</div>
                    <div style={{ fontSize: '11.5px', color: '#B7AFC9', flex: 'none' }}>{th.date}</div>
                  </div>
                  {th.notes && <div style={{ fontSize: '12.5px', color: '#8A8398', marginTop: '3px' }}>{th.notes}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13.5px', color: '#B7AFC9' }}>{t.noTreatments}</div>
          )}
        </div>

        <div style={{ flex: '1 1 100%', background: '#FFFFFF', border: '1px solid #ECE7F3', borderRadius: '18px', padding: '22px' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>{t.xray}</div>
          {xrays.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {xrays.map((r) => (
                <div key={r.id} style={{ width: '200px' }}>
                  <div style={{ width: '200px', height: '150px', borderRadius: '14px', overflow: 'hidden', background: '#FAF9FC', border: '1px solid #ECE7F3' }}>
                    <img src={r.xray} alt="X-ray" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B7AFC9', marginTop: '6px' }}>{r.procedure || t.generalCheckup} · {r.createdAt}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ width: '280px', height: '150px', borderRadius: '14px', border: '1.5px dashed #D9D2E8', background: '#FAF9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12.5px', color: '#B7AFC9' }}>{t.noXrayOnFile}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatLocalDate(datetime: string) {
  return datetime ? datetime.replace('T', ' ') : ''
}

function isWithinNextHours(datetime: string, hours: number) {
  const appointmentTime = new Date(datetime).getTime()
  const now = Date.now()
  const cutoff = now + hours * 60 * 60 * 1000
  return appointmentTime >= now && appointmentTime <= cutoff
}

export default App
