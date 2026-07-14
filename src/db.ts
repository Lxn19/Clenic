import alasql from 'alasql'

const runSql = (sql: string, params?: any) => (alasql as any)(sql, params)

export interface Patient {
  id: number
  name: string
  phone: string
  email: string
  address: string
  insurance: string
  receipt: string
  age?: number
  guardian?: string
  medicalHistory?: string
  status?: string
  xray?: string
  dentalInsurance?: string
  medicalInsurance?: string
  anesthesia?: string
  nextAppointment?: string
  specialNeeds?: string
}

export interface Receipt {
  id: number
  patientId: number
  procedure: string
  teeth: string[]
  prescription: string
  xray: string
  dentistNote: string
  cost: string
  createdAt: string
}

export interface Appointment {
  id: number
  patientId: number
  datetime: string
  reason: string
  notes: string
  teeth: string[]
  receipt: string
  notified: boolean
  patientDob?: string
  patientGender?: string
  patientGuardian?: string
  homeAddress?: string
  cityStateZip?: string
  medicalInsurance?: string
  dentalInsurance?: string
  radiographsAvailable?: string
  medicalHistory?: string
  anesthesiaRecommendations?: string
  medicalHistoryNotes?: string
  specialNeeds?: string
  referralReasons?: string[]
  additionalComments?: string
  status?: string
}

export interface AppointmentSummary extends Appointment {
  patientName: string
}

export const TEETH = Array.from({ length: 32 }, (_, index) => `${index + 1}`)

const STORAGE_KEY = 'clenic-clinic-data'

function normalizeAppointment(value: any): Appointment {
  return {
    id: typeof value.id === 'number' ? value.id : 0,
    patientId: typeof value.patientId === 'number' ? value.patientId : 0,
    datetime: typeof value.datetime === 'string' ? value.datetime : '',
    reason: typeof value.reason === 'string' ? value.reason : '',
    notes: typeof value.notes === 'string' ? value.notes : '',
    teeth: Array.isArray(value.teeth) ? value.teeth : [],
    receipt: typeof value.receipt === 'string' ? value.receipt : '',
    notified: Boolean(value.notified),
    patientDob: typeof value.patientDob === 'string' ? value.patientDob : '',
    patientGender: typeof value.patientGender === 'string' ? value.patientGender : '',
    patientGuardian: typeof value.patientGuardian === 'string' ? value.patientGuardian : '',
    homeAddress: typeof value.homeAddress === 'string' ? value.homeAddress : '',
    cityStateZip: typeof value.cityStateZip === 'string' ? value.cityStateZip : '',
    medicalInsurance: typeof value.medicalInsurance === 'string' ? value.medicalInsurance : '',
    dentalInsurance: typeof value.dentalInsurance === 'string' ? value.dentalInsurance : '',
    radiographsAvailable: typeof value.radiographsAvailable === 'string' ? value.radiographsAvailable : '',
    medicalHistory: typeof value.medicalHistory === 'string' ? value.medicalHistory : '',
    anesthesiaRecommendations: typeof value.anesthesiaRecommendations === 'string' ? value.anesthesiaRecommendations : '',
    medicalHistoryNotes: typeof value.medicalHistoryNotes === 'string' ? value.medicalHistoryNotes : '',
    specialNeeds: typeof value.specialNeeds === 'string' ? value.specialNeeds : '',
    referralReasons: Array.isArray(value.referralReasons) ? value.referralReasons : [],
    additionalComments: typeof value.additionalComments === 'string' ? value.additionalComments : '',
    status: typeof value.status === 'string' ? value.status : 'Confirmed',
  }
}

function normalizePatient(value: any): Patient {
  return {
    id: typeof value.id === 'number' ? value.id : 0,
    name: typeof value.name === 'string' ? value.name : '',
    phone: typeof value.phone === 'string' ? value.phone : '',
    email: typeof value.email === 'string' ? value.email : '',
    address: typeof value.address === 'string' ? value.address : '',
    insurance: typeof value.insurance === 'string' ? value.insurance : '',
    receipt: typeof value.receipt === 'string' ? value.receipt : '',
    age: typeof value.age === 'number' ? value.age : undefined,
    guardian: typeof value.guardian === 'string' ? value.guardian : '',
    medicalHistory: typeof value.medicalHistory === 'string' ? value.medicalHistory : '',
    status: typeof value.status === 'string' ? value.status : 'Active',
    xray: typeof value.xray === 'string' ? value.xray : '',
    dentalInsurance: typeof value.dentalInsurance === 'string' ? value.dentalInsurance : '',
    medicalInsurance: typeof value.medicalInsurance === 'string' ? value.medicalInsurance : '',
    anesthesia: typeof value.anesthesia === 'string' ? value.anesthesia : 'None',
    nextAppointment: typeof value.nextAppointment === 'string' ? value.nextAppointment : '',
    specialNeeds: typeof value.specialNeeds === 'string' ? value.specialNeeds : '',
  }
}

function normalizeReceipt(value: any): Receipt {
  return {
    id: typeof value.id === 'number' ? value.id : 0,
    patientId: typeof value.patientId === 'number' ? value.patientId : 0,
    procedure: typeof value.procedure === 'string' ? value.procedure : '',
    teeth: Array.isArray(value.teeth) ? value.teeth : [],
    prescription: typeof value.prescription === 'string' ? value.prescription : '',
    xray: typeof value.xray === 'string' ? value.xray : '',
    dentistNote: typeof value.dentistNote === 'string' ? value.dentistNote : '',
    cost: typeof value.cost === 'string' ? value.cost : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
  }
}

export function loadClinicData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { patients: [] as Patient[], appointments: [] as Appointment[], receipts: [] as Receipt[] }
    }
    const parsed = JSON.parse(raw)
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients.map(normalizePatient) : [],
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments.map(normalizeAppointment)
        : [],
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts.map(normalizeReceipt) : [],
    }
  } catch (error) {
    console.warn('Failed to load clinic data', error)
    return { patients: [] as Patient[], appointments: [] as Appointment[], receipts: [] as Receipt[] }
  }
}

export function saveClinicData(patients: Patient[], appointments: Appointment[], receipts: Receipt[] = []) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ patients, appointments, receipts }),
  )
}

export function nextId(items: { id: number }[]) {
  return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
}

export function queryPatients(patients: Patient[], filter = '') {
  if (!filter.trim()) {
    return patients
  }
  const search = `%${filter.toLowerCase()}%`
  return runSql(
    'SELECT * FROM ? WHERE LOWER(name) LIKE ? OR LOWER(phone) LIKE ? OR LOWER(email) LIKE ?',
    [patients, search, search, search],
  ) as Patient[]
}

export function queryAppointmentsWithPatient(
  appointments: Appointment[],
  patients: Patient[],
): AppointmentSummary[] {
  return runSql(
    'SELECT a.*, p.name AS patientName FROM ? AS a JOIN ? AS p ON a.patientId = p.id ORDER BY a.datetime',
    [appointments, patients],
  ) as AppointmentSummary[]
}

export function queryAppointmentsByDate(
  appointments: Appointment[],
  patients: Patient[],
  date: string,
): AppointmentSummary[] {
  const start = `${date}T00:00`
  const end = `${date}T23:59`
  return runSql(
    'SELECT a.*, p.name AS patientName FROM ? AS a JOIN ? AS p ON a.patientId = p.id WHERE a.datetime >= ? AND a.datetime <= ? ORDER BY a.datetime',
    [appointments, patients, start, end],
  ) as AppointmentSummary[]
}

export function queryUpcomingAppointments(
  appointments: Appointment[],
  patients: Patient[],
  hours: number,
): AppointmentSummary[] {
  const now = new Date()
  const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000)
  return runSql(
    'SELECT a.*, p.name AS patientName FROM ? AS a JOIN ? AS p ON a.patientId = p.id WHERE a.datetime >= ? AND a.datetime <= ? ORDER BY a.datetime',
    [appointments, patients, formatLocalDatetime(now), formatLocalDatetime(cutoff)],
  ) as AppointmentSummary[]
}

export function formatLocalDatetime(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  const hours = `${value.getHours()}`.padStart(2, '0')
  const minutes = `${value.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getPatientById(patients: Patient[], id: number) {
  return patients.find((patient) => patient.id === id)
}

export function getAppointmentsForPatient(
  appointments: Appointment[],
  patientId: number,
): Appointment[] {
  return alasql('SELECT * FROM ? WHERE patientId = ? ORDER BY datetime', [appointments, patientId]) as Appointment[]
}

export function getReceiptsForPatient(receipts: Receipt[], patientId: number): Receipt[] {
  return receipts
    .filter((receipt) => receipt.patientId === patientId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}