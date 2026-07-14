import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import type { Appointment, AppointmentSummary } from './db'
import {
  getAppointmentsForPatient,
  getPatientById,
  loadClinicData,
  nextId,
  queryAppointmentsByDate,
  queryPatients,
  queryUpcomingAppointments,
  saveClinicData,
  TEETH,
} from './db'
import { loadWhatsAppConfig, sendWhatsAppReminder, setWhatsAppConfig } from './whatsapp'
import './App.css'

const REMINDER_HOURS = 12

function formatLocalDate(datetime: string) {
  return datetime ? datetime.replace('T', ' ') : ''
}

function getTime(datetime: string) {
  return datetime.split('T')[1] ?? ''
}

function isWithinNextHours(datetime: string, hours: number) {
  const appointmentTime = new Date(datetime).getTime()
  const now = Date.now()
  const cutoff = now + hours * 60 * 60 * 1000
  return appointmentTime >= now && appointmentTime <= cutoff
}

function App() {
  const [patients, setPatients] = useState([] as any[])
  const [appointments, setAppointments] = useState([] as Appointment[])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied'>(() =>
    typeof Notification === 'undefined' ? 'denied' : (Notification.permission as 'default' | 'granted' | 'denied'),
  )
  const [patientSearch, setPatientSearch] = useState('')

  useEffect(() => {
    const loaded = loadClinicData()
    setPatients(loaded.patients)
    setAppointments(loaded.appointments)
  }, [])

  useEffect(() => {
    saveClinicData(patients, appointments)
  }, [patients, appointments])

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      return
    }

    const soon = appointments.filter(
      (appointment) => appointment.notified === false && isWithinNextHours(appointment.datetime, REMINDER_HOURS),
    )

    if (soon.length === 0) {
      return
    }

    const next = soon[0]
    const patient = getPatientById(patients, next.patientId)
    if (!patient) {
      return
    }

    const message = `Reminder: ${patient.name} has an appointment within ${REMINDER_HOURS} hours on ${formatLocalDate(
      next.datetime,
    )}`
    setNotificationMessage(message)

    if (Notification.permission === 'granted') {
      new Notification('Dental clinic reminder', {
        body: message,
      })
    }

    // Send WhatsApp reminder if configured and phone number exists
    if (patient.phone) {
      sendWhatsAppReminder(patient.phone, patient.name, next.datetime).then((success) => {
        if (success) {
          console.log(`WhatsApp reminder sent to ${patient.name}`)
        } else {
          console.log('WhatsApp reminder failed or not configured')
        }
      })
    }

    setAppointments((current) =>
      current.map((appointment) =>
        soon.some((matched) => matched.id === appointment.id)
          ? { ...appointment, notified: true }
          : appointment,
      ),
    )
  }, [appointments, patients])

  const todayAppointments = useMemo(() => {
    const today = new Date()
    const dateKey = today.toISOString().split('T')[0]
    return queryAppointmentsByDate(appointments, patients, dateKey)
  }, [appointments, patients])

  const upcomingReminders = useMemo(
    () => queryUpcomingAppointments(appointments, patients, REMINDER_HOURS),
    [appointments, patients],
  )

  const filteredPatients = useMemo(
    () => queryPatients(patients, patientSearch),
    [patients, patientSearch],
  )

  function addOrUpdatePatient(patient: any) {
    if (!patient.name.trim()) {
      return
    }

    if (patient.id) {
      setPatients((current) =>
        current.map((existing) => (existing.id === patient.id ? { ...existing, ...patient } : existing)),
      )
      return
    }

    setPatients((current) => [...current, { ...patient, id: nextId(current) }])
  }

  function addOrUpdateAppointment(appointment: Appointment) {
    if (!appointment.patientId || !appointment.datetime.trim()) {
      return
    }

    if (appointment.id) {
      setAppointments((current) =>
        current.map((existing) => (existing.id === appointment.id ? { ...existing, ...appointment } : existing)),
      )
      return
    }

    setAppointments((current) => [...current, { ...appointment, id: nextId(current), notified: false }])
  }

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null

  function requestNotificationPermission() {
    if (typeof Notification === 'undefined') {
      return
    }
    Notification.requestPermission().then((permission) => {
      setPermissionState(permission)
      if (permission === 'granted') {
        setNotificationMessage('Notifications enabled. You will receive a reminder before the next appointment.')
      }
    })
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <h1>Clenic Dental Organizer</h1>
            <p>Manage dentist appointments and patient treatment records from one dentist dashboard.</p>
          </div>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Today
            </NavLink>
            <NavLink to="/set-appointment" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Set appointment
            </NavLink>
            <NavLink to="/receipts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Receipts
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Settings
            </NavLink>
          </nav>
        </header>

        {notificationMessage ? (
          <div className="banner">
            <span>{notificationMessage}</span>
            <button onClick={() => setNotificationMessage('')} className="secondary-button">
              Dismiss
            </button>
          </div>
        ) : null}

        <main className="main-shell">
          <Routes>
            <Route
              path="/"
              element={
                <SchedulePage
                  appointments={todayAppointments}
                  onSelect={(id) => setSelectedAppointmentId(id)}
                  selectedAppointment={selectedAppointment}
                  upcomingReminders={upcomingReminders}
                />
              }
            />
            <Route
              path="/set-appointment"
              element={
                <AppointmentSetupPage
                  patientSearch={patientSearch}
                  setPatientSearch={setPatientSearch}
                  filteredPatients={filteredPatients}
                  patients={patients}
                  appointments={appointments}
                  onSavePatient={addOrUpdatePatient}
                  onSaveAppointment={addOrUpdateAppointment}
                />
              }
            />
            <Route
              path="/receipts"
              element={
                <ReceiptPage
                  appointments={appointments}
                  patients={patients}
                  onSaveAppointment={addOrUpdateAppointment}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage />
              }
            />
          </Routes>
        </main>

        <footer className="footer">
          <button onClick={requestNotificationPermission} className="primary-button">
            {permissionState === 'granted' ? 'Notifications enabled' : 'Enable reminders'}
          </button>
          <p>Reminder window: {REMINDER_HOURS} hours before appointment</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

function SchedulePage({
  appointments,
  onSelect,
  selectedAppointment,
  upcomingReminders,
}: {
  appointments: AppointmentSummary[]
  onSelect: (id: number) => void
  selectedAppointment: Appointment | null
  upcomingReminders: AppointmentSummary[]
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleAppointments = showAll ? appointments : appointments.slice(0, 3)

  return (
    <section className="dashboard">
      <div className="dashboard-row">
        <div className="panel calendar-panel">
          <div className="panel-header">
            <div>
              <h2>Today's schedule</h2>
              <p>Tap an appointment to view the full treatment record.</p>
            </div>
            {appointments.length > 3 ? (
              <button className="secondary-button" onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Show less' : 'Show all'}
              </button>
            ) : null}
          </div>
          <div className="appointment-grid">
            {visibleAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                className="appointment-card"
                onClick={() => onSelect(appointment.id)}
              >
                <span className="appointment-time">{getTime(appointment.datetime)}</span>
                <strong>{appointment.patientName}</strong>
                <span>{appointment.reason || 'Treatment review'}</span>
              </button>
            ))}
            {appointments.length === 0 ? <div className="empty-state">No appointments today.</div> : null}
          </div>
        </div>

        <div className="panel detail-panel">
          <div className="panel-header">
            <h2>Appointment details</h2>
          </div>
          {selectedAppointment ? (
            <AppointmentDetail appointment={selectedAppointment} />
          ) : (
            <div className="empty-state">Select an appointment to see details.</div>
          )}
        </div>
      </div>

      <div className="panel reminder-panel">
        <div className="panel-header">
          <h2>Upcoming reminders</h2>
        </div>
        {upcomingReminders.length > 0 ? (
          upcomingReminders.map((appointment) => (
            <div key={appointment.id} className="reminder-card">
              <span>{appointment.patientName}</span>
              <span>{formatLocalDate(appointment.datetime)}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">No upcoming reminders in the next 12 hours.</div>
        )}
      </div>
    </section>
  )
}

function AppointmentDetail({ appointment }: { appointment: Appointment }) {
  const clinicData = loadClinicData()
  const patient = getPatientById(clinicData.patients, appointment.patientId)
  const teethList = appointment.teeth.length > 0 ? appointment.teeth.join(', ') : 'No teeth selected'

  return (
    <div className="appointment-detail">
      <p>
        <strong>Date:</strong> {formatLocalDate(appointment.datetime)}
      </p>
      <p>
        <strong>Patient:</strong> {patient?.name ?? 'Unknown'}
      </p>
      <p>
        <strong>Reason:</strong> {appointment.reason || 'General dental appointment'}
      </p>
      <p>
        <strong>Teeth treated:</strong> {teethList}
      </p>
      <p>
        <strong>Notes:</strong> {appointment.notes || 'No additional notes'}
      </p>
      <p>
        <strong>Receipt:</strong> {appointment.receipt || 'No receipt entered'}
      </p>
    </div>
  )
}

function ReceiptPage({
  appointments,
  patients,
  onSaveAppointment,
}: {
  appointments: Appointment[]
  patients: any[]
  onSaveAppointment: (appointment: Appointment) => void
}) {
  const [activeAppointmentId, setActiveAppointmentId] = useState<number | null>(null)

  useEffect(() => {
    if (appointments.length > 0 && activeAppointmentId === null) {
      setActiveAppointmentId(appointments[0].id)
    }
  }, [appointments, activeAppointmentId])

  const selectedAppointment = activeAppointmentId
    ? appointments.find((appointment) => appointment.id === activeAppointmentId) ?? null
    : null
  const selectedPatient = selectedAppointment
    ? getPatientById(patients, selectedAppointment.patientId)
    : null

  const [providerName, setProviderName] = useState('Archer Dentistry - Dr. Ruiz')
  const [providerPhone, setProviderPhone] = useState('773-624-5800')
  const [providerEmail, setProviderEmail] = useState('cdpractice@archerdentistry.com')
  const [patientDob, setPatientDob] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [patientGuardian, setPatientGuardian] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [cityStateZip, setCityStateZip] = useState('')
  const [medicalInsurance, setMedicalInsurance] = useState('')
  const [dentalInsurance, setDentalInsurance] = useState('')
  const [radiographsAvailable, setRadiographsAvailable] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [anesthesiaRecommendations, setAnesthesiaRecommendations] = useState('')
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState('')
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [referralReasons, setReferralReasons] = useState<string[]>([])
  const [additionalComments, setAdditionalComments] = useState('')
  const [receiptText, setReceiptText] = useState('')
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const primaryTeeth = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K']
  const referralOptions = ['Permanent Teeth', 'Consultation', 'Extraction', 'Crown', 'Other']

  useEffect(() => {
    if (!selectedAppointment) {
      setReceiptText('')
      setSelectedTeeth([])
      setPatientDob('')
      setPatientGender('')
      setPatientGuardian('')
      setHomeAddress('')
      setCityStateZip('')
      setMedicalInsurance('')
      setDentalInsurance('')
      setRadiographsAvailable('')
      setMedicalHistory('')
      setAnesthesiaRecommendations('')
      setMedicalHistoryNotes('')
      setSpecialNeeds('')
      setReferralReasons([])
      setAdditionalComments('')
      return
    }

    setReceiptText(selectedAppointment.receipt || '')
    setSelectedTeeth(selectedAppointment.teeth ?? [])
    setPatientDob(selectedAppointment.patientDob || '')
    setPatientGender(selectedAppointment.patientGender || '')
    setPatientGuardian(selectedAppointment.patientGuardian || '')
    setHomeAddress(selectedAppointment.homeAddress || selectedPatient?.address || '')
    setCityStateZip(selectedAppointment.cityStateZip || '')
    setMedicalInsurance(selectedAppointment.medicalInsurance || selectedPatient?.insurance || '')
    setDentalInsurance(selectedAppointment.dentalInsurance || '')
    setRadiographsAvailable(selectedAppointment.radiographsAvailable || '')
    setMedicalHistory(selectedAppointment.medicalHistory || '')
    setAnesthesiaRecommendations(selectedAppointment.anesthesiaRecommendations || '')
    setMedicalHistoryNotes(selectedAppointment.medicalHistoryNotes || '')
    setSpecialNeeds(selectedAppointment.specialNeeds || '')
    setReferralReasons(selectedAppointment.referralReasons || [])
    setAdditionalComments(selectedAppointment.additionalComments || '')
  }, [selectedAppointment, selectedPatient])

  function toggleTooth(tooth: string) {
    setSelectedTeeth((current) =>
      current.includes(tooth) ? current.filter((item) => item !== tooth) : [...current, tooth],
    )
  }

  function toggleReason(reason: string) {
    setReferralReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )
  }

  return (
    <section className="receipt-page">
      <div className="dashboard-row">
        <div className="panel calendar-panel">
          <div className="panel-header">
            <div>
              <h2>Receipt records</h2>
              <p>Select an appointment to edit a receipt and clinical record.</p>
            </div>
          </div>
          <div className="appointment-grid">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  className={`appointment-card ${appointment.id === activeAppointmentId ? 'selected' : ''}`}
                  onClick={() => setActiveAppointmentId(appointment.id)}
                >
                  <span className="appointment-time">{getTime(appointment.datetime)}</span>
                  <strong>{getPatientById(patients, appointment.patientId)?.name ?? 'Unknown'}</strong>
                  <span>{appointment.reason || 'Treatment'}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">No appointments available to create receipts.</div>
            )}
          </div>
        </div>

        <div className="panel detail-panel receipt-editor-panel">
          <div className="panel-header">
            <h2>Receipt editor</h2>
          </div>
          {selectedAppointment ? (
            <form
              className="receipt-form"
              onSubmit={(event) => {
                event.preventDefault()
                onSaveAppointment({
                  ...selectedAppointment,
                  receipt: receiptText,
                  teeth: selectedTeeth,
                  patientDob,
                  patientGender,
                  patientGuardian,
                  homeAddress,
                  cityStateZip,
                  medicalInsurance,
                  dentalInsurance,
                  radiographsAvailable,
                  medicalHistory,
                  anesthesiaRecommendations,
                  medicalHistoryNotes,
                  specialNeeds,
                  referralReasons,
                  additionalComments,
                })
              }}
            >
              <div className="receipt-section receipt-header">
                <div className="receipt-block">
                  <h3>Provider information</h3>
                  <div className="receipt-row-inline">
                    <label>
                      Referring Practice Name / Doctor Name
                      <input value={providerName} onChange={(event) => setProviderName(event.target.value)} />
                    </label>
                  </div>
                  <div className="receipt-row-inline">
                    <label>
                      Phone
                      <input value={providerPhone} onChange={(event) => setProviderPhone(event.target.value)} />
                    </label>
                    <label>
                      Email
                      <input value={providerEmail} onChange={(event) => setProviderEmail(event.target.value)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="receipt-grid">
                <div className="receipt-section">
                  <h3>Patient information</h3>
                  <div className="receipt-two-column">
                    <label>
                      Patient Name
                      <input value={selectedPatient?.name ?? ''} readOnly />
                    </label>
                    <label>
                      DOB
                      <input value={patientDob} onChange={(event) => setPatientDob(event.target.value)} />
                    </label>
                    <label>
                      Gender
                      <input value={patientGender} onChange={(event) => setPatientGender(event.target.value)} />
                    </label>
                    <label>
                      Parent/Guardian
                      <input value={patientGuardian} onChange={(event) => setPatientGuardian(event.target.value)} />
                    </label>
                    <label>
                      Home Address
                      <input value={homeAddress} onChange={(event) => setHomeAddress(event.target.value)} />
                    </label>
                    <label>
                      City, State, ZIP
                      <input value={cityStateZip} onChange={(event) => setCityStateZip(event.target.value)} />
                    </label>
                    <label>
                      Phone
                      <input value={selectedPatient?.phone ?? ''} readOnly />
                    </label>
                    <label>
                      Email (preferred)
                      <input value={selectedPatient?.email ?? ''} readOnly />
                    </label>
                    <label>
                      Medical Insurance
                      <input value={medicalInsurance} onChange={(event) => setMedicalInsurance(event.target.value)} />
                    </label>
                    <label>
                      Dental Insurance
                      <input value={dentalInsurance} onChange={(event) => setDentalInsurance(event.target.value)} />
                    </label>
                    <label>
                      Are radiographs available?
                      <input value={radiographsAvailable} onChange={(event) => setRadiographsAvailable(event.target.value)} />
                    </label>
                    <label>
                      Medical History
                      <input value={medicalHistory} onChange={(event) => setMedicalHistory(event.target.value)} />
                    </label>
                    <label>
                      Anesthesia recommendations
                      <input value={anesthesiaRecommendations} onChange={(event) => setAnesthesiaRecommendations(event.target.value)} />
                    </label>
                    <label>
                      Medical history notes
                      <input value={medicalHistoryNotes} onChange={(event) => setMedicalHistoryNotes(event.target.value)} />
                    </label>
                    <label>
                      Special needs
                      <input value={specialNeeds} onChange={(event) => setSpecialNeeds(event.target.value)} />
                    </label>
                  </div>
                </div>

                <div className="receipt-section receipt-side-panel">
                  <div className="receipt-block">
                    <h3>Reason(s) for referral</h3>
                    <div className="receipt-checkboxes">
                      {referralOptions.map((reason) => (
                        <label key={reason} className="receipt-checkbox">
                          <input
                            type="checkbox"
                            checked={referralReasons.includes(reason)}
                            onChange={() => toggleReason(reason)}
                          />
                          {reason}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="receipt-block">
                    <h3>Additional comments</h3>
                    <textarea
                      value={additionalComments}
                      onChange={(event) => setAdditionalComments(event.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              <div className="receipt-chart">
                <div className="receipt-card">
                  <div className="receipt-card-header">
                    <h4>Permanent Teeth</h4>
                  </div>
                  <div className="tooth-chart permanent">
                    {TEETH.map((tooth) => (
                      <button
                        type="button"
                        key={tooth}
                        className={`tooth-button ${selectedTeeth.includes(tooth) ? 'selected' : ''}`}
                        onClick={() => toggleTooth(tooth)}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="receipt-card">
                  <div className="receipt-card-header">
                    <h4>Primary Teeth</h4>
                  </div>
                  <div className="tooth-chart primary">
                    {primaryTeeth.map((tooth) => (
                      <button
                        type="button"
                        key={tooth}
                        className={`tooth-button ${selectedTeeth.includes(tooth) ? 'selected' : ''}`}
                        onClick={() => toggleTooth(tooth)}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label>
                Receipt details
                <textarea
                  value={receiptText}
                  onChange={(event) => setReceiptText(event.target.value)}
                  rows={6}
                />
              </label>
              <button type="submit" className="primary-button">
                Save receipt
              </button>
            </form>
          ) : (
            <div className="empty-state">Select an appointment to edit its receipt.</div>
          )}
        </div>
      </div>
    </section>
  )
}

function AppointmentSetupPage({
  patientSearch,
  setPatientSearch,
  filteredPatients,
  patients,
  appointments,
  onSavePatient,
  onSaveAppointment,
}: {
  patientSearch: string
  setPatientSearch: (value: string) => void
  filteredPatients: any[]
  patients: any[]
  appointments: Appointment[]
  onSavePatient: (patient: any) => void
  onSaveAppointment: (appointment: Appointment) => void
}) {
  const [activePatientId, setActivePatientId] = useState<number | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const selectedPatient = activePatientId ? getPatientById(patients, activePatientId) : null
  const patientAppointments = activePatientId ? getAppointmentsForPatient(appointments, activePatientId) : []

  return (
    <section className="patients-page">
      <div className="patients-sidebar">
        <div className="panel-header">
          <div>
            <h2>Patients</h2>
            <p>Search or select a patient to create or update appointments.</p>
          </div>
        </div>
        <input
          className="search-input"
          type="search"
          placeholder="Find patient by name, phone or email"
          value={patientSearch}
          onChange={(event) => setPatientSearch(event.target.value)}
        />
        <div className="patient-list">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <button
                type="button"
                key={patient.id}
                className={`patient-list-item ${patient.id === activePatientId ? 'active' : ''}`}
                onClick={() => {
                  setActivePatientId(patient.id)
                  setEditingAppointment(null)
                }}
              >
                <strong>{patient.name}</strong>
                <span>{patient.phone || patient.email || 'No contact'}</span>
              </button>
            ))
          ) : (
            <div className="empty-state">No patients found.</div>
          )}
        </div>
      </div>

      <div className="patients-main">
        <div className="panel">
          <div className="panel-header">
            <h2>{selectedPatient ? 'Patient details' : 'Add a new patient'}</h2>
          </div>
          <PatientForm
            patient={selectedPatient}
            onSave={(patient) => {
              onSavePatient(patient)
              if (patient.id) {
                setActivePatientId(patient.id)
              }
            }}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Appointment journal</h2>
            <p>Track patient treatments, teeth and receipts.</p>
          </div>
          {selectedPatient ? (
            <>
              <AppointmentForm
                patientId={selectedPatient.id}
                existingAppointment={editingAppointment}
                onSave={(appointment) => {
                  onSaveAppointment(appointment)
                  setEditingAppointment(null)
                }}
              />
              <div className="appointment-list">
                {patientAppointments.length > 0 ? (
                  patientAppointments.map((appointment) => (
                    <button
                      type="button"
                      onClick={() => setEditingAppointment(appointment)}
                      key={appointment.id}
                      className="appointment-list-item"
                    >
                      <div>
                        <strong>{formatLocalDate(appointment.datetime)}</strong>
                        <span>{appointment.reason || 'Treatment'}</span>
                      </div>
                      <span>{appointment.teeth.length > 0 ? appointment.teeth.join(', ') : 'No teeth'}</span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">This patient has no appointments yet.</div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a patient from the list or add a new one to schedule appointments.</div>
          )}
        </div>
      </div>
    </section>
  )
}

function PatientForm({
  patient,
  onSave,
}: {
  patient: any | null
  onSave: (patient: any) => void
}) {
  const [formState, setFormState] = useState(
    patient ?? {
      name: '',
      phone: '',
      email: '',
      address: '',
      insurance: '',
      receipt: '',
    },
  )

  useEffect(() => {
    setFormState(
      patient ?? {
        name: '',
        phone: '',
        email: '',
        address: '',
        insurance: '',
        receipt: '',
      },
    )
  }, [patient])

  return (
    <form
      className="record-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ ...formState, id: patient?.id })
      }}
    >
      <label>
        Patient name
        <input
          value={formState.name}
          onChange={(event) => setFormState({ ...formState, name: event.target.value })}
          required
        />
      </label>
      <label>
        Phone
        <input
          value={formState.phone}
          onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
        />
      </label>
      <label>
        Email
        <input
          value={formState.email}
          onChange={(event) => setFormState({ ...formState, email: event.target.value })}
        />
      </label>
      <label>
        Address
        <input
          value={formState.address}
          onChange={(event) => setFormState({ ...formState, address: event.target.value })}
        />
      </label>
      <label>
        Insurance / Contract details
        <textarea
          value={formState.insurance}
          onChange={(event) => setFormState({ ...formState, insurance: event.target.value })}
        />
      </label>
      <label>
        Default receipt notes
        <textarea
          value={formState.receipt}
          onChange={(event) => setFormState({ ...formState, receipt: event.target.value })}
        />
      </label>
      <button type="submit" className="primary-button">
        Save patient
      </button>
    </form>
  )
}

function AppointmentForm({
  patientId,
  existingAppointment,
  onSave,
}: {
  patientId: number
  existingAppointment: Appointment | null
  onSave: (appointment: Appointment) => void
}) {
  const [datetime, setDatetime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [receipt, setReceipt] = useState('')
  const [teeth, setTeeth] = useState<string[]>([])

  useEffect(() => {
    if (existingAppointment) {
      setDatetime(existingAppointment.datetime)
      setReason(existingAppointment.reason)
      setNotes(existingAppointment.notes)
      setReceipt(existingAppointment.receipt)
      setTeeth(existingAppointment.teeth)
      return
    }
    setDatetime('')
    setReason('')
    setNotes('')
    setReceipt('')
    setTeeth([])
  }, [existingAppointment])

  function toggleTooth(tooth: string) {
    setTeeth((current) =>
      current.includes(tooth) ? current.filter((item) => item !== tooth) : [...current, tooth],
    )
  }

  return (
    <form
      className="record-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          id: existingAppointment?.id ?? 0,
          patientId,
          datetime,
          reason,
          notes,
          teeth,
          receipt,
          notified: existingAppointment?.notified ?? false,
        })
      }}
    >
      <label>
        Appointment date and time
        <input
          type="datetime-local"
          value={datetime}
          onChange={(event) => setDatetime(event.target.value)}
          required
        />
      </label>
      <label>
        Appointment reason
        <input value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <label>
        Treatment notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label>
        Receipt details
        <textarea value={receipt} onChange={(event) => setReceipt(event.target.value)} />
      </label>
      <div className="tooth-grid">
        {TEETH.map((tooth) => (
          <button
            type="button"
            key={tooth}
            className={`tooth-button ${teeth.includes(tooth) ? 'selected' : ''}`}
            onClick={() => toggleTooth(tooth)}
          >
            {tooth}
          </button>
        ))}
      </div>
      <button type="submit" className="primary-button">
        {existingAppointment ? 'Update appointment' : 'Save appointment'}
      </button>
    </form>
  )
}

function SettingsPage() {
  const [config, setConfig] = useState(loadWhatsAppConfig() ?? {
    accountSid: '',
    authToken: '',
    twilioPhoneNumber: '',
    enabled: false,
  })

  const [saveMessage, setSaveMessage] = useState('')

  function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!config.accountSid.trim() || !config.authToken.trim() || !config.twilioPhoneNumber.trim()) {
      setSaveMessage('Please fill in all WhatsApp fields')
      return
    }

    setWhatsAppConfig(config)
    setSaveMessage('WhatsApp settings saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  return (
    <div className="page">
      <h2>Settings</h2>
      <p>Configure WhatsApp reminders for patient appointments</p>

      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-section">
          <h3>WhatsApp Integration (Twilio)</h3>

          <label>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
            />
            Enable WhatsApp reminders
          </label>

          <label>
            Twilio Account SID
            <input
              type="password"
              placeholder="Your Twilio Account SID"
              value={config.accountSid}
              onChange={(e) =>
              setConfig((prev) => ({
                  ...prev,
                  accountSid: e.target.value,
                }))
              }
              disabled={!config.enabled}
            />
            <small>Find this in your Twilio Console Settings</small>
          </label>

          <label>
            Twilio Auth Token
            <input
              type="password"
              placeholder="Your Twilio Auth Token"
              value={config.authToken}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  authToken: e.target.value,
                }))
              }
              disabled={!config.enabled}
            />
            <small>Find this in your Twilio Console Settings</small>
          </label>

          <label>
            Twilio WhatsApp Number
            <input
              type="tel"
              placeholder="+1234567890"
              value={config.twilioPhoneNumber}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  twilioPhoneNumber: e.target.value,
                }))
              }
              disabled={!config.enabled}
            />
            <small>WhatsApp sandbox number or verified business number (with country code)</small>
          </label>

          <div className="info-box">
            <strong>How to set up WhatsApp reminders:</strong>
            <ol>
              <li>Sign up for a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noreferrer">twilio.com</a></li>
              <li>Enable WhatsApp integration in Twilio Console</li>
              <li>Copy your Account SID and Auth Token from Console Settings</li>
              <li>Add your WhatsApp Sandbox or Business number</li>
              <li>Enable the toggle above and save</li>
              <li>Make sure patient phone numbers include country code (e.g., +1 for USA)</li>
            </ol>
          </div>

          {saveMessage && <div className="success-message">{saveMessage}</div>}

          <button type="submit" className="primary-button">
            Save WhatsApp Settings
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
