import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ACADEMIC_YEAR,
  DEMO_PASSWORD,
  INITIAL_ADVISING,
  INITIAL_ALLOCATIONS,
  INITIAL_COURSE_REGISTRATIONS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_EVENT_REGISTRATIONS,
  INITIAL_EVENTS,
  INITIAL_PREREQUISITES,
  INITIAL_PROGRAMMES,
  INITIAL_RESIDENCES,
  INITIAL_STUDENTS,
  INITIAL_SUPPORT,
  INITIAL_USERS,
  rosterLabel,
} from '../src/data/initialData';
import { FORM_CATALOG, FORM_IDS } from '../src/survey/catalog';
import { AuthUser, RosterEntry, Session, UserRole } from '../src/types/auth';
import {
  AdvisingInput,
  AdvisingMeeting,
  AllocationInput,
  CampusEvent,
  Course,
  CourseInput,
  CourseRegistrationInput,
  Department,
  EventInput,
  EventRegistrationInput,
  Programme,
  Residence,
  ResidenceInput,
  StaffMember,
  Student,
  StudentInput,
  StudentProfile,
  SupportInput,
  SupportRequest,
  SupportUpdateInput,
} from '../src/types/campus';
import { FormVersionInfo, StoredFormVersion } from '../src/types/forms';
import { CampusError } from './errors';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS programmes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id),
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  student_id TEXT,
  seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_number TEXT NOT NULL COLLATE NOCASE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  programme_id TEXT NOT NULL REFERENCES programmes(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_dob ON students(date_of_birth);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  course_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department_id TEXT NOT NULL REFERENCES departments(id),
  semester TEXT NOT NULL,
  credits INTEGER NOT NULL,
  instructor TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_id TEXT NOT NULL REFERENCES courses(id),
  PRIMARY KEY (course_id, prerequisite_id)
);

CREATE TABLE IF NOT EXISTS course_registrations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id),
  enrollment_type TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  registration_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Registered',
  form_version_id TEXT,
  UNIQUE (student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_course_reg_student ON course_registrations(student_id);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  baseline_registrations INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id),
  area_of_interest TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  registration_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Registered',
  form_version_id TEXT,
  UNIQUE (student_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);

CREATE TABLE IF NOT EXISTS residences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  weekly_rate INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  baseline_occupancy INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accommodation_allocations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  residence_id TEXT NOT NULL REFERENCES residences(id),
  room_type TEXT NOT NULL,
  contract TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Allocated',
  form_version_id TEXT,
  UNIQUE (student_id)
);
CREATE INDEX IF NOT EXISTS idx_allocation_residence ON accommodation_allocations(residence_id);

CREATE TABLE IF NOT EXISTS advising_meetings (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  advisor_id TEXT NOT NULL REFERENCES users(id),
  meeting_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  follow_up_date TEXT NOT NULL DEFAULT '',
  form_version_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_advising_student ON advising_meetings(student_id, meeting_date);

CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  supporting_information TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  form_version_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_support_student ON support_requests(student_id, created_at);

CREATE TABLE IF NOT EXISTS support_request_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  assigned_to TEXT NOT NULL DEFAULT '',
  actor_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS form_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active_version_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS form_versions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  schema_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (form_id, version_number)
);

CREATE TABLE IF NOT EXISTS form_responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES form_definitions(id),
  form_version_id TEXT NOT NULL REFERENCES form_versions(id),
  respondent_id TEXT,
  response_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);
`;

const STUDENT_STATUSES = ['Enrolled', 'On Leave', 'Graduated', 'Withdrawn'];
const ENROLLMENT_TYPES = ['Standard', 'Elective', 'Audit'];
const SUPPORT_TYPES = ['Academic Support', 'Accessibility Support', 'Financial Support', 'Personal Support', 'Technical Support'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const SUPPORT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const HALL_CATEGORIES = ['Catered', 'Self-catered', 'Accessible'];
const ROOM_TYPES = ['Single', 'Shared', 'Ensuite', 'Accessible'];
const CONTRACTS = ['Full year', 'Semester 1', 'Semester 2'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_TABLES = [
  'form_responses',
  'form_versions',
  'form_definitions',
  'support_request_events',
  'support_requests',
  'advising_meetings',
  'event_registrations',
  'accommodation_allocations',
  'residences',
  'course_registrations',
  'course_prerequisites',
  'events',
  'courses',
  'sessions',
  'students',
  'programmes',
  'departments',
  'users',
];

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function passwordsMatch(password: string, hash: string): boolean {
  const actual = Buffer.from(hashPassword(password));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function nowIso(): string {
  return new Date().toISOString();
}

function today(): string {
  return nowIso().slice(0, 10);
}

function fail(message: string, status = 400): never {
  throw new CampusError(message, status);
}

function required(value: string, label: string): string {
  if (!value.trim()) fail(`${label} is required.`);
  return value.trim();
}

export interface StudentSearchQuery {
  name?: string;
  surname?: string;
  dateOfBirth?: string;
  studentNumber?: string;
  courseCode?: string;
}

export interface SupportFilter {
  status?: string;
  requestType?: string;
}

export type CampusDb = ReturnType<typeof createDb>;

export function createDb(dbPath: string) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  const studentSelect = `
    SELECT s.*, p.name AS programme_name, d.name AS department_name
    FROM students s
    JOIN programmes p ON p.id = s.programme_id
    JOIN departments d ON d.id = s.department_id
  `;

  function rowToStudent(row: any): Student {
    return {
      id: row.id,
      studentNumber: row.student_number,
      displayName: `${row.first_name} ${row.last_name}`,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      email: row.email,
      phone: row.phone,
      address: row.address,
      programmeId: row.programme_id,
      programmeName: row.programme_name,
      departmentId: row.department_id,
      departmentName: row.department_name,
      academicYear: row.academic_year,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function publicUser(row: any): AuthUser {
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
      studentId: row.student_id || undefined,
    };
  }

  function staffName(userId: string): string {
    if (!userId) return '';
    const row = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as { full_name: string } | undefined;
    return row?.full_name ?? '';
  }

  function coursePrerequisites(courseId: string): { courseCode: string; name: string }[] {
    return (
      db
        .prepare(
          `SELECT c.course_code AS courseCode, c.name
           FROM course_prerequisites cp
           JOIN courses c ON c.id = cp.prerequisite_id
           WHERE cp.course_id = ?
           ORDER BY c.course_code`,
        )
        .all(courseId) as { courseCode: string; name: string }[]
    );
  }

  function rowToCourse(row: any): Course {
    const enrolled = Number(row.enrolled);
    return {
      id: row.id,
      courseCode: row.course_code,
      name: row.name,
      label: `${row.course_code} — ${row.name}`,
      description: row.description,
      departmentId: row.department_id,
      departmentName: row.department_name,
      semester: row.semester,
      credits: row.credits,
      instructor: row.instructor,
      capacity: row.capacity,
      enrolled,
      availablePlaces: Math.max(0, row.capacity - enrolled),
      status: row.status,
      prerequisites: coursePrerequisites(row.id),
    };
  }

  const courseSelect = `
    SELECT c.*, d.name AS department_name,
      (SELECT COUNT(*) FROM course_registrations r WHERE r.course_id = c.id AND r.status = 'Registered') AS enrolled
    FROM courses c
    JOIN departments d ON d.id = c.department_id
  `;

  function eventRegistrationCount(eventId: string, baseline: number): number {
    const row = db
      .prepare(`SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = ? AND status = 'Registered'`)
      .get(eventId) as { count: number };
    return baseline + row.count;
  }

  function eventParticipants(eventId: string) {
    return (
      db
        .prepare(
          `SELECT r.id, r.student_id, s.student_number, s.first_name, s.last_name,
                  r.area_of_interest, r.notes, r.registration_date, r.status
           FROM event_registrations r
           JOIN students s ON s.id = r.student_id
           WHERE r.event_id = ?
           ORDER BY r.registration_date, s.last_name`,
        )
        .all(eventId) as any[]
    ).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      studentNumber: row.student_number,
      studentName: `${row.first_name} ${row.last_name}`,
      areaOfInterest: row.area_of_interest,
      notes: row.notes,
      registrationDate: row.registration_date,
      status: row.status,
    }));
  }

  function rowToEvent(row: any, withParticipants: boolean): CampusEvent {
    const registeredCount = eventRegistrationCount(row.id, row.baseline_registrations);
    const registrationStatus = row.status === 'cancelled' ? 'Cancelled' : registeredCount >= row.capacity ? 'Full' : 'Open';
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      eventDate: row.event_date,
      location: row.location,
      capacity: row.capacity,
      registeredCount,
      availablePlaces: Math.max(0, row.capacity - registeredCount),
      status: row.status,
      registrationStatus,
      baselineRegistrations: row.baseline_registrations,
      participants: withParticipants ? eventParticipants(row.id) : [],
    };
  }

  function occupiedCount(residenceId: string, baseline: number): number {
    const row = db
      .prepare(`SELECT COUNT(*) AS count FROM accommodation_allocations WHERE residence_id = ? AND status = 'Allocated'`)
      .get(residenceId) as { count: number };
    return baseline + row.count;
  }

  function hallResidents(residenceId: string) {
    return (
      db
        .prepare(
          `SELECT a.id, a.student_id, s.student_number, s.first_name, s.last_name,
                  a.room_type, a.contract, a.notes, a.start_date, a.status
           FROM accommodation_allocations a
           JOIN students s ON s.id = a.student_id
           WHERE a.residence_id = ?
           ORDER BY s.last_name, s.first_name`,
        )
        .all(residenceId) as any[]
    ).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      studentNumber: row.student_number,
      studentName: `${row.first_name} ${row.last_name}`,
      roomType: row.room_type,
      contract: row.contract,
      notes: row.notes,
      startDate: row.start_date,
      status: row.status,
    }));
  }

  function placesFor(studentId: string) {
    return (
      db
        .prepare(
          `SELECT a.id, a.residence_id, r.name, r.category, a.room_type, a.contract, a.notes, a.status, a.start_date
           FROM accommodation_allocations a
           JOIN residences r ON r.id = a.residence_id
           WHERE a.student_id = ?
           ORDER BY a.start_date`,
        )
        .all(studentId) as any[]
    ).map((row) => ({
      id: row.id,
      residenceId: row.residence_id,
      residenceName: row.name,
      category: row.category,
      roomType: row.room_type,
      contract: row.contract,
      notes: row.notes,
      status: row.status,
      startDate: row.start_date,
    }));
  }

  function rowToResidence(row: any, withResidents: boolean): Residence {
    const occupied = occupiedCount(row.id, row.baseline_occupancy);
    const occupancyStatus = row.status === 'closed' ? 'Closed' : occupied >= row.capacity ? 'Full' : 'Open';
    return {
      id: row.id,
      name: row.name,
      label: `${row.name} — ${row.category} (${Math.max(0, row.capacity - occupied)} places)`,
      category: row.category,
      description: row.description,
      location: row.location,
      weeklyRate: row.weekly_rate,
      capacity: row.capacity,
      occupied,
      availablePlaces: Math.max(0, row.capacity - occupied),
      status: row.status,
      occupancyStatus,
      baselineOccupancy: row.baseline_occupancy,
      residents: withResidents ? hallResidents(row.id) : [],
    };
  }

  function supportHistory(requestId: string) {
    return (
      db
        .prepare(
          `SELECT e.id, e.status, e.assigned_to, e.created_at, u.full_name AS assigned_name
           FROM support_request_events e
           LEFT JOIN users u ON u.id = e.assigned_to
           WHERE e.request_id = ?
           ORDER BY e.created_at, e.id`,
        )
        .all(requestId) as any[]
    ).map((row) => ({
      id: row.id,
      status: row.status,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_name || '',
      createdAt: row.created_at,
    }));
  }

  function rowToSupport(row: any): SupportRequest {
    return {
      id: row.id,
      studentId: row.student_id,
      requestType: row.request_type,
      description: row.description,
      priority: row.priority,
      supportingInformation: row.supporting_information,
      assignedTo: row.assigned_to,
      assignedToName: staffName(row.assigned_to),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      history: supportHistory(row.id),
    };
  }

  function advisingFor(studentId: string): AdvisingMeeting[] {
    return (
      db
        .prepare(
          `SELECT m.*, u.full_name AS advisor_name
           FROM advising_meetings m
           JOIN users u ON u.id = m.advisor_id
           WHERE m.student_id = ?
           ORDER BY m.meeting_date, m.id`,
        )
        .all(studentId) as any[]
    ).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      advisorId: row.advisor_id,
      advisorName: row.advisor_name,
      meetingDate: row.meeting_date,
      topic: row.topic,
      notes: row.notes,
      followUpDate: row.follow_up_date,
    }));
  }

  function coursesFor(studentId: string) {
    return (
      db
        .prepare(
          `SELECT r.id, r.course_id, c.course_code, c.name, c.semester, r.enrollment_type, r.status, r.registration_date, r.notes
           FROM course_registrations r
           JOIN courses c ON c.id = r.course_id
           WHERE r.student_id = ?
           ORDER BY c.course_code`,
        )
        .all(studentId) as any[]
    ).map((row) => ({
      id: row.id,
      courseId: row.course_id,
      courseCode: row.course_code,
      courseName: row.name,
      semester: row.semester,
      enrollmentType: row.enrollment_type,
      status: row.status,
      registrationDate: row.registration_date,
      notes: row.notes,
    }));
  }

  function supportFor(studentId: string, filter: SupportFilter = {}): SupportRequest[] {
    const rows = db
      .prepare(
        `SELECT * FROM support_requests
         WHERE student_id = ?
           AND (? = '' OR status = ?)
           AND (? = '' OR request_type = ?)
         ORDER BY created_at DESC`,
      )
      .all(studentId, filter.status ?? '', filter.status ?? '', filter.requestType ?? '', filter.requestType ?? '') as any[];
    return rows.map(rowToSupport);
  }

  function profile(student: Student, filter?: SupportFilter): StudentProfile {
    return {
      ...student,
      courses: coursesFor(student.id),
      advising: advisingFor(student.id),
      supportRequests: supportFor(student.id, filter),
      accommodation: placesFor(student.id),
    };
  }

  function findStudentRow(id: string) {
    return db.prepare(`${studentSelect} WHERE s.id = ?`).get(id);
  }

  function requireStudent(id: string): Student {
    const row = findStudentRow(id);
    if (!row) fail('Student not found.', 404);
    return rowToStudent(row);
  }

  function programmeDepartment(programmeId: string): string {
    const row = db.prepare('SELECT department_id FROM programmes WHERE id = ?').get(programmeId) as
      | { department_id: string }
      | undefined;
    if (!row) fail('Select a valid programme.');
    return row.department_id;
  }

  function assertDepartment(departmentId: string) {
    const row = db.prepare('SELECT id FROM departments WHERE id = ?').get(departmentId);
    if (!row) fail('Select a valid department.');
  }

  function validateStudent(input: StudentInput, ignoreId?: string): Required<StudentInput> {
    const firstName = required(input.firstName, 'First name');
    const lastName = required(input.lastName, 'Last name');
    const dateOfBirth = required(input.dateOfBirth, 'Date of birth');
    const studentNumber = required(input.studentNumber, 'Student ID');
    const programmeId = required(input.programmeId, 'Programme');
    const departmentId = required(input.departmentId, 'Department');
    const email = required(input.email, 'Email');
    if (!EMAIL_PATTERN.test(email)) fail('Email address is not valid.');
    if (programmeDepartment(programmeId) !== departmentId) fail('Department does not match the selected programme.');
    assertDepartment(departmentId);
    const duplicate = db.prepare('SELECT id FROM students WHERE student_number = ? COLLATE NOCASE').get(studentNumber) as
      | { id: string }
      | undefined;
    if (duplicate && duplicate.id !== ignoreId) fail('A student with this student ID already exists.', 409);
    const status = input.status?.trim() || 'Enrolled';
    if (!STUDENT_STATUSES.includes(status)) fail('Enrollment status is not valid.');
    return {
      firstName,
      lastName,
      dateOfBirth,
      studentNumber,
      programmeId,
      departmentId,
      email,
      phone: input.phone?.trim() ?? '',
      address: input.address?.trim() ?? '',
      academicYear: input.academicYear?.trim() || ACADEMIC_YEAR,
      status,
    };
  }

  function versionFor(formId: string, requestedId?: string): string {
    if (!FORM_IDS.has(formId)) fail('Unknown form.', 404);
    if (requestedId) {
      const row = db.prepare('SELECT id, form_id FROM form_versions WHERE id = ?').get(requestedId) as
        | { id: string; form_id: string }
        | undefined;
      if (!row || row.form_id !== formId) fail('That form version is not valid.');
      return row.id;
    }
    const active = db.prepare('SELECT active_version_id FROM form_definitions WHERE id = ?').get(formId) as
      | { active_version_id: string }
      | undefined;
    if (!active?.active_version_id) fail('This form has no active version.', 404);
    return active.active_version_id;
  }

  function storeResponse(formId: string, versionId: string, respondentId: string | undefined, response: unknown) {
    db.prepare(
      `INSERT INTO form_responses (id, form_id, form_version_id, respondent_id, response_json, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), formId, versionId, respondentId ?? null, JSON.stringify(response ?? {}), nowIso());
  }

  function requireCourseByCode(courseCode: string) {
    const row = db.prepare(`${courseSelect} WHERE c.course_code = ? COLLATE NOCASE`).get(courseCode.trim());
    if (!row) fail('No course matches that course code.', 404);
    return row as any;
  }

  function requireStudentByNumber(studentNumber: string): Student {
    const row = db.prepare(`${studentSelect} WHERE s.student_number = ? COLLATE NOCASE`).get(studentNumber.trim());
    if (!row) fail('No student matches that student ID.', 404);
    return rowToStudent(row);
  }

  function requireAdvisor(advisorId: string) {
    const row = db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(advisorId) as { id: string; role: string } | undefined;
    if (!row || (row.role !== 'academic' && row.role !== 'administrator')) fail('Select a valid advisor.');
  }

  function requireStaff(userId: string) {
    const row = db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(userId) as { id: string; role: string } | undefined;
    if (!row || row.role === 'student') fail('Select a staff member.');
  }

  const seedAll = db.transaction(() => {
    const stamp = '2025-09-01T09:00:00.000Z';
    const insertDepartment = db.prepare('INSERT INTO departments (id, name, description) VALUES (?, ?, ?)');
    for (const department of INITIAL_DEPARTMENTS) insertDepartment.run(department.id, department.name, department.description);

    const insertProgramme = db.prepare('INSERT INTO programmes (id, name, department_id, description) VALUES (?, ?, ?, ?)');
    for (const programme of INITIAL_PROGRAMMES) {
      insertProgramme.run(programme.id, programme.name, programme.departmentId, programme.description);
    }

    const passwordHash = hashPassword(DEMO_PASSWORD);
    const insertUser = db.prepare(
      'INSERT INTO users (id, username, password_hash, full_name, role, student_id, seq) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (const user of INITIAL_USERS) {
      insertUser.run(user.id, user.username, passwordHash, user.fullName, user.role, user.studentId ?? null, user.seq);
    }

    const insertStudent = db.prepare(
      `INSERT INTO students (
        id, student_number, first_name, last_name, date_of_birth, email, phone, address,
        programme_id, department_id, academic_year, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const student of INITIAL_STUDENTS) {
      insertStudent.run(
        student.id,
        student.studentNumber,
        student.firstName,
        student.lastName,
        student.dateOfBirth,
        student.email,
        student.phone,
        student.address,
        student.programmeId,
        student.departmentId,
        student.academicYear,
        student.status,
        stamp,
        stamp,
      );
    }

    const insertCourse = db.prepare(
      `INSERT INTO courses (
        id, course_code, name, description, department_id, semester, credits, instructor, capacity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const course of INITIAL_COURSES) {
      insertCourse.run(
        course.id,
        course.courseCode,
        course.name,
        course.description,
        course.departmentId,
        course.semester,
        course.credits,
        course.instructor,
        course.capacity,
        course.status,
      );
    }

    const courseIdByCode = new Map(INITIAL_COURSES.map((course) => [course.courseCode, course.id]));
    const insertPrereq = db.prepare('INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES (?, ?)');
    for (const link of INITIAL_PREREQUISITES) {
      insertPrereq.run(courseIdByCode.get(link.courseCode), courseIdByCode.get(link.prerequisiteCode));
    }

    const insertEvent = db.prepare(
      `INSERT INTO events (id, name, category, description, event_date, location, capacity, status, baseline_registrations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const event of INITIAL_EVENTS) {
      insertEvent.run(
        event.id,
        event.name,
        event.category,
        event.description,
        event.eventDate,
        event.location,
        event.capacity,
        event.status,
        event.baselineRegistrations,
      );
    }

    const insertDefinition = db.prepare(
      `INSERT INTO form_definitions (id, name, category, description, active_version_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 'system', ?, ?)`,
    );
    const insertVersion = db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at)
       VALUES (?, ?, 1, ?, 'system', ?)`,
    );
    const versionIds = new Map<string, string>();
    for (const form of FORM_CATALOG) {
      const versionId = randomUUID();
      versionIds.set(form.id, versionId);
      insertDefinition.run(form.id, form.name, form.category, form.description, versionId, stamp, stamp);
      insertVersion.run(versionId, form.id, JSON.stringify(form.schema), stamp);
    }

    const insertCourseReg = db.prepare(
      `INSERT INTO course_registrations (
        id, student_id, course_id, enrollment_type, notes, registration_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, '2025-09-15', 'Registered', ?)`,
    );
    for (const registration of INITIAL_COURSE_REGISTRATIONS) {
      insertCourseReg.run(
        registration.id,
        registration.studentId,
        registration.courseId,
        registration.enrollmentType,
        registration.notes,
        versionIds.get('course-registration'),
      );
    }

    const insertEventReg = db.prepare(
      `INSERT INTO event_registrations (
        id, student_id, event_id, area_of_interest, notes, registration_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, '2026-01-10T09:00:00.000Z', 'Registered', ?)`,
    );
    for (const registration of INITIAL_EVENT_REGISTRATIONS) {
      insertEventReg.run(
        registration.id,
        registration.studentId,
        registration.eventId,
        registration.areaOfInterest,
        registration.notes,
        versionIds.get('event-registration'),
      );
    }

    const insertResidence = db.prepare(
      `INSERT INTO residences (
        id, name, category, description, location, weekly_rate, capacity, status, baseline_occupancy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const hall of INITIAL_RESIDENCES) {
      insertResidence.run(
        hall.id,
        hall.name,
        hall.category,
        hall.description,
        hall.location,
        hall.weeklyRate,
        hall.capacity,
        hall.status,
        hall.baselineOccupancy,
      );
    }
    const insertAllocation = db.prepare(
      `INSERT INTO accommodation_allocations (
        id, student_id, residence_id, room_type, contract, notes, start_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, '2025-09-20', 'Allocated', ?)`,
    );
    for (const place of INITIAL_ALLOCATIONS) {
      insertAllocation.run(
        place.id,
        place.studentId,
        place.residenceId,
        place.roomType,
        place.contract,
        place.notes,
        versionIds.get('accommodation-application'),
      );
    }

    const insertAdvising = db.prepare(
      `INSERT INTO advising_meetings (id, student_id, advisor_id, meeting_date, topic, notes, follow_up_date, form_version_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const meeting of INITIAL_ADVISING) {
      insertAdvising.run(
        meeting.id,
        meeting.studentId,
        meeting.advisorId,
        meeting.meetingDate,
        meeting.topic,
        meeting.notes,
        meeting.followUpDate,
        versionIds.get('advising'),
      );
    }

    const insertSupport = db.prepare(
      `INSERT INTO support_requests (
        id, student_id, request_type, description, priority, supporting_information, assigned_to, status, created_at, updated_at, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertSupportEvent = db.prepare(
      `INSERT INTO support_request_events (id, request_id, status, assigned_to, actor_id, created_at)
       VALUES (?, ?, ?, ?, 'user-amira', ?)`,
    );
    for (const request of INITIAL_SUPPORT) {
      const updatedAt = request.history[request.history.length - 1]?.createdAt ?? request.createdAt;
      insertSupport.run(
        request.id,
        request.studentId,
        request.requestType,
        request.description,
        request.priority,
        request.supportingInformation,
        request.assignedTo,
        request.status,
        request.createdAt,
        updatedAt,
        versionIds.get('support-request'),
      );
      for (const event of request.history) insertSupportEvent.run(randomUUID(), request.id, event.status, event.assignedTo, event.createdAt);
    }
  });

  if ((db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count === 0) seedAll();

  const backfillForms = db.transaction(() => {
    const stamp = new Date().toISOString();
    const findForm = db.prepare('SELECT id FROM form_definitions WHERE id = ?');
    const insertVersion = db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, ?, 1, ?, 'system', ?)`,
    );
    const insertForm = db.prepare(
      `INSERT INTO form_definitions (id, name, category, description, active_version_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 'system', ?, ?)`,
    );
    for (const form of FORM_CATALOG) {
      if (findForm.get(form.id)) continue;
      const versionId = randomUUID();
      insertForm.run(form.id, form.name, form.category, form.description, versionId, stamp, stamp);
      insertVersion.run(versionId, form.id, JSON.stringify(form.schema), stamp);
    }
  });
  backfillForms();

  const widenStudentSearch = db.transaction(() => {
    const row = db
      .prepare(
        `SELECT v.id, v.version_number, v.schema_json
         FROM form_definitions d
         JOIN form_versions v ON v.id = d.active_version_id
         WHERE d.id = 'student-search'`,
      )
      .get() as { id: string; version_number: number; schema_json: string } | undefined;
    if (!row) return;
    const schema = JSON.parse(row.schema_json) as {
      pages?: { elements?: { name?: string; title?: string; placeholder?: string }[] }[];
    };
    const question = schema.pages?.flatMap((page) => page.elements ?? []).find((element) => element.name === 'surname');
    if (!question || question.title !== 'Surname') return;
    question.name = 'name';
    question.title = 'Name';
    question.placeholder = 'e.g. Emma Thompson';
    const versionId = randomUUID();
    const stamp = new Date().toISOString();
    db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, 'student-search', ?, ?, 'system', ?)`,
    ).run(versionId, row.version_number + 1, JSON.stringify(schema), stamp);
    db.prepare(
      `UPDATE form_definitions SET active_version_id = ?, description = ?, updated_at = ? WHERE id = 'student-search'`,
    ).run(versionId, 'Search students by name, date of birth, or student ID.', stamp);
  });
  widenStudentSearch();

  const quietLoginCopy = db.transaction(() => {
    const row = db
      .prepare(
        `SELECT d.name, v.version_number, v.schema_json
         FROM form_definitions d
         JOIN form_versions v ON v.id = d.active_version_id
         WHERE d.id = 'login'`,
      )
      .get() as { name: string; version_number: number; schema_json: string } | undefined;
    if (!row) return;
    const schema = JSON.parse(row.schema_json) as {
      title?: string;
      pages?: { elements?: { name?: string; description?: string }[] }[];
    };
    let changed = false;
    if (schema.title === 'Campus Sign In') {
      schema.title = 'Sign In';
      changed = true;
    }
    const password = schema.pages?.flatMap((page) => page.elements ?? []).find((element) => element.name === 'password');
    if (password?.description?.includes('demo1234')) {
      delete password.description;
      changed = true;
    }
    const stamp = new Date().toISOString();
    if (!changed) {
      if (row.name === 'Campus Sign In') {
        db.prepare(`UPDATE form_definitions SET name = 'Sign In', updated_at = ? WHERE id = 'login'`).run(stamp);
      }
      return;
    }
    const versionId = randomUUID();
    db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, 'login', ?, ?, 'system', ?)`,
    ).run(versionId, row.version_number + 1, JSON.stringify(schema), stamp);
    db.prepare(
      `UPDATE form_definitions SET name = CASE WHEN name = 'Campus Sign In' THEN 'Sign In' ELSE name END, active_version_id = ?, updated_at = ? WHERE id = 'login'`,
    ).run(versionId, stamp);
  });
  quietLoginCopy();

  const compactCourseRegistration = db.transaction(() => {
    const row = db
      .prepare(
        `SELECT v.version_number, v.schema_json
         FROM form_definitions d
         JOIN form_versions v ON v.id = d.active_version_id
         WHERE d.id = 'course-registration'`,
      )
      .get() as { version_number: number; schema_json: string } | undefined;
    if (!row) return;
    const schema = JSON.parse(row.schema_json) as {
      pages?: { elements?: { name?: string; type?: string; startWithNewLine?: boolean; placeholder?: string; choicesByUrl?: object }[] }[];
    };
    const elements = schema.pages?.flatMap((page) => page.elements ?? []) ?? [];
    const student = elements.find((element) => element.name === 'student_number');
    const course = elements.find((element) => element.name === 'course_code');
    if (!student) return;
    const choicesUrl = (student.choicesByUrl as { url?: string } | undefined)?.url ?? '';
    const stockText = student.type === 'text';
    const filteredList = student.type === 'dropdown' && choicesUrl.includes('courseCode=');
    if (!stockText && !filteredList) return;
    student.type = 'dropdown';
    student.placeholder = 'Select a student';
    student.choicesByUrl = { url: '/api/students', valueName: 'studentNumber', titleName: 'displayName' };
    if (course) course.startWithNewLine = false;
    const versionId = randomUUID();
    const stamp = new Date().toISOString();
    db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, 'course-registration', ?, ?, 'system', ?)`,
    ).run(versionId, row.version_number + 1, JSON.stringify(schema), stamp);
    db.prepare(`UPDATE form_definitions SET active_version_id = ?, updated_at = ? WHERE id = 'course-registration'`).run(versionId, stamp);
  });
  compactCourseRegistration();

  const publishActiveSchema = (formId: string, schema: object, versionNumber: number) => {
    const versionId = randomUUID();
    const stamp = new Date().toISOString();
    db.prepare(
      `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, ?, ?, ?, 'system', ?)`,
    ).run(versionId, formId, versionNumber, JSON.stringify(schema), stamp);
    db.prepare(`UPDATE form_definitions SET active_version_id = ?, updated_at = ? WHERE id = ?`).run(versionId, stamp, formId);
  };

  const activeSchema = (formId: string) =>
    db
      .prepare(
        `SELECT v.version_number, v.schema_json
         FROM form_definitions d
         JOIN form_versions v ON v.id = d.active_version_id
         WHERE d.id = ?`,
      )
      .get(formId) as { version_number: number; schema_json: string } | undefined;

  const dropSearchDescription = db.transaction(() => {
    const row = activeSchema('student-search');
    if (!row) return;
    const schema = JSON.parse(row.schema_json) as { description?: string };
    if (schema.description !== 'Results update as you type. Leave every field blank to list the directory.') return;
    delete schema.description;
    publishActiveSchema('student-search', schema, row.version_number + 1);
  });
  dropSearchDescription();

  const studentListQuestion = {
    type: 'dropdown',
    placeholder: 'Select a student',
    choicesByUrl: { url: '/api/students', valueName: 'studentNumber', titleName: 'displayName' },
  };
  const useStudentList = db.transaction((formId: string) => {
    const row = activeSchema(formId);
    if (!row) return;
    const schema = JSON.parse(row.schema_json) as {
      pages?: { elements?: { name?: string; type?: string; placeholder?: string; choicesByUrl?: object }[] }[];
    };
    const student = schema.pages?.flatMap((page) => page.elements ?? []).find((element) => element.name === 'student_number');
    if (!student || student.type !== 'text') return;
    Object.assign(student, studentListQuestion);
    publishActiveSchema(formId, schema, row.version_number + 1);
  });
  useStudentList('event-registration');
  useStudentList('accommodation-application');

  if ((db.prepare('SELECT COUNT(*) AS count FROM residences').get() as { count: number }).count === 0) {
    const version = db.prepare(`SELECT id FROM form_versions WHERE form_id = 'accommodation-application' ORDER BY version_number DESC LIMIT 1`).get() as
      | { id: string }
      | undefined;
    const insertResidence = db.prepare(
      `INSERT INTO residences (
        id, name, category, description, location, weekly_rate, capacity, status, baseline_occupancy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertAllocation = db.prepare(
      `INSERT INTO accommodation_allocations (
        id, student_id, residence_id, room_type, contract, notes, start_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, '2025-09-20', 'Allocated', ?)`,
    );
    const fill = db.transaction(() => {
      for (const hall of INITIAL_RESIDENCES) {
        insertResidence.run(hall.id, hall.name, hall.category, hall.description, hall.location, hall.weeklyRate, hall.capacity, hall.status, hall.baselineOccupancy);
      }
      for (const place of INITIAL_ALLOCATIONS) {
        insertAllocation.run(place.id, place.studentId, place.residenceId, place.roomType, place.contract, place.notes, version?.id ?? null);
      }
    });
    fill();
  }

  function searchStudents(query: StudentSearchQuery, viewer: AuthUser): Student[] {
    const name = (query.name || query.surname || '').trim().replace(/\s+/g, ' ');
    const dateOfBirth = query.dateOfBirth?.trim() ?? '';
    const studentNumber = query.studentNumber?.trim() ?? '';
    const rows = db
      .prepare(
        `${studentSelect}
         WHERE (? = '' OR (s.first_name || ' ' || s.last_name) LIKE '%' || ? || '%' COLLATE NOCASE
                        OR (s.last_name || ' ' || s.first_name) LIKE '%' || ? || '%' COLLATE NOCASE)
           AND (? = '' OR s.date_of_birth = ?)
           AND (? = '' OR s.student_number LIKE '%' || ? || '%' COLLATE NOCASE)
         ORDER BY s.last_name, s.first_name`,
      )
      .all(name, name, name, dateOfBirth, dateOfBirth, studentNumber, studentNumber) as any[];
    let students = rows.map(rowToStudent);
    if (viewer.role === 'student') students = students.filter((student) => student.id === viewer.studentId);
    const courseCode = query.courseCode?.trim() ?? '';
    if (!courseCode) return students;
    const course = db.prepare('SELECT id FROM courses WHERE course_code = ? COLLATE NOCASE').get(courseCode) as { id: string } | undefined;
    if (!course) return [];
    const prerequisites = db.prepare('SELECT prerequisite_id FROM course_prerequisites WHERE course_id = ?').all(course.id) as {
      prerequisite_id: string;
    }[];
    const registered = new Set(
      (db.prepare('SELECT student_id FROM course_registrations WHERE course_id = ?').all(course.id) as { student_id: string }[]).map(
        (item) => item.student_id,
      ),
    );
    const completed = db.prepare('SELECT 1 FROM course_registrations WHERE student_id = ? AND course_id = ?');
    return students.filter(
      (student) => !registered.has(student.id) && prerequisites.every((item) => completed.get(student.id, item.prerequisite_id)),
    );
  }

  function getProfile(id: string, viewer: AuthUser, filter?: SupportFilter): StudentProfile {
    if (viewer.role === 'student' && viewer.studentId !== id) fail('You can only open your own student record.', 403);
    return profile(requireStudent(id), filter);
  }

  const writeStudent = db.transaction(
    (input: StudentInput, actor: AuthUser, formId: string, formVersionId: string | undefined, response: unknown, existingId?: string) => {
      const value = validateStudent(input, existingId);
      const stamp = nowIso();
      const versionId = versionFor(formId, formVersionId);
      if (existingId) {
        requireStudent(existingId);
        db.prepare(
          `UPDATE students SET
            student_number = ?, first_name = ?, last_name = ?, date_of_birth = ?, email = ?, phone = ?, address = ?,
            programme_id = ?, department_id = ?, academic_year = ?, status = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          value.studentNumber,
          value.firstName,
          value.lastName,
          value.dateOfBirth,
          value.email,
          value.phone,
          value.address,
          value.programmeId,
          value.departmentId,
          value.academicYear,
          value.status,
          stamp,
          existingId,
        );
      } else {
        const id = randomUUID();
        db.prepare(
          `INSERT INTO students (
            id, student_number, first_name, last_name, date_of_birth, email, phone, address,
            programme_id, department_id, academic_year, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          value.studentNumber,
          value.firstName,
          value.lastName,
          value.dateOfBirth,
          value.email,
          value.phone,
          value.address,
          value.programmeId,
          value.departmentId,
          value.academicYear,
          value.status,
          stamp,
          stamp,
        );
        existingId = id;
      }
      storeResponse(formId, versionId, actor.id, response);
      return profile(requireStudent(existingId));
    },
  );

  function saveCourseRecord(input: CourseInput, existingId?: string): Course {
    const courseCode = required(input.courseCode, 'Course code').toUpperCase();
    const name = required(input.name, 'Course name');
    const departmentId = required(input.departmentId, 'Department');
    const semester = required(input.semester, 'Semester');
    const instructor = required(input.instructor, 'Instructor');
    assertDepartment(departmentId);
    if (!['Semester 1', 'Semester 2'].includes(semester)) fail('Semester is not valid.');
    if (!Number.isFinite(input.credits) || input.credits < 0) fail('Credits must be zero or greater.');
    if (!Number.isInteger(input.capacity) || input.capacity < 1) fail('Capacity must be at least 1.');
    const status = input.status === 'inactive' ? 'inactive' : input.status === 'active' ? 'active' : '';
    if (!status) fail('Course status is not valid.');
    const duplicate = db.prepare('SELECT id FROM courses WHERE course_code = ? COLLATE NOCASE').get(courseCode) as
      | { id: string }
      | undefined;
    if (duplicate && duplicate.id !== existingId) fail('A course with this code already exists.', 409);
    const prerequisiteIds: string[] = [];
    for (const code of input.prerequisites ?? []) {
      const row = db.prepare('SELECT id, course_code FROM courses WHERE course_code = ? COLLATE NOCASE').get(code) as
        | { id: string; course_code: string }
        | undefined;
      if (!row) fail(`Unknown prerequisite: ${code}.`);
      if (row.course_code.toUpperCase() === courseCode || row.id === existingId) fail('A course cannot be its own prerequisite.');
      prerequisiteIds.push(row.id);
    }
    const id = existingId ?? randomUUID();
    if (existingId) {
      if (!db.prepare('SELECT id FROM courses WHERE id = ?').get(existingId)) fail('Course not found.', 404);
      const enrolled = (
        db.prepare(`SELECT COUNT(*) AS count FROM course_registrations WHERE course_id = ? AND status = 'Registered'`).get(existingId) as {
          count: number;
        }
      ).count;
      if (input.capacity < enrolled) fail('Capacity cannot be lower than the number of registered students.', 409);
      db.prepare(
        `UPDATE courses SET course_code = ?, name = ?, description = ?, department_id = ?, semester = ?, credits = ?, instructor = ?, capacity = ?, status = ?
         WHERE id = ?`,
      ).run(courseCode, name, input.description?.trim() ?? '', departmentId, semester, input.credits, instructor, input.capacity, status, id);
      db.prepare('DELETE FROM course_prerequisites WHERE course_id = ?').run(id);
    } else {
      db.prepare(
        `INSERT INTO courses (id, course_code, name, description, department_id, semester, credits, instructor, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, courseCode, name, input.description?.trim() ?? '', departmentId, semester, input.credits, instructor, input.capacity, status);
    }
    const insertPrereq = db.prepare('INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES (?, ?)');
    for (const prerequisiteId of prerequisiteIds) insertPrereq.run(id, prerequisiteId);
    return rowToCourse(db.prepare(`${courseSelect} WHERE c.id = ?`).get(id));
  }

  const saveCourse = db.transaction((input: CourseInput, actor: AuthUser, formVersionId: string | undefined, response: unknown, existingId?: string) => {
    const course = saveCourseRecord(input, existingId);
    storeResponse('course-admin', versionFor('course-admin', formVersionId), actor.id, response);
    return course;
  });

  const registerForCourse = db.transaction((input: CourseRegistrationInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) => {
    if (!input.prerequisiteConfirmation) fail('Confirm that the student meets the prerequisites.');
    if (!ENROLLMENT_TYPES.includes(input.enrollmentType)) fail('Enrollment type is not valid.');
    const student = requireStudentByNumber(required(input.studentNumber, 'Student ID'));
    const course = requireCourseByCode(required(input.courseCode, 'Course'));
    if (course.status !== 'active') fail('This course is not open for registration.', 409);
    if (course.enrolled >= course.capacity) fail('This course has no available places.', 409);
    const existing = db
      .prepare('SELECT id FROM course_registrations WHERE student_id = ? AND course_id = ?')
      .get(student.id, course.id);
    if (existing) fail('This student is already registered for the course.', 409);
    const missing = db
      .prepare(
        `SELECT pre.course_code AS courseCode
         FROM course_prerequisites cp
         JOIN courses pre ON pre.id = cp.prerequisite_id
         WHERE cp.course_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM course_registrations r
             WHERE r.course_id = cp.prerequisite_id
               AND r.student_id = ?
               AND r.status = 'Registered'
               AND r.enrollment_type != 'Audit'
           )
         ORDER BY pre.course_code`,
      )
      .all(course.id, student.id) as { courseCode: string }[];
    if (missing.length) fail(`Missing prerequisites: ${missing.map((item) => item.courseCode).join(', ')}.`, 409);
    const versionId = versionFor('course-registration', formVersionId);
    db.prepare(
      `INSERT INTO course_registrations (id, student_id, course_id, enrollment_type, notes, registration_date, status, form_version_id)
       VALUES (?, ?, ?, ?, ?, ?, 'Registered', ?)`,
    ).run(randomUUID(), student.id, course.id, input.enrollmentType, input.notes?.trim() ?? '', today(), versionId);
    storeResponse('course-registration', versionId, actor.id, response);
    return rowToCourse(db.prepare(`${courseSelect} WHERE c.id = ?`).get(course.id));
  });

  const saveEvent = db.transaction((input: EventInput, actor: AuthUser, formVersionId: string | undefined, response: unknown, existingId?: string) => {
    const name = required(input.name, 'Event name');
    const category = required(input.category, 'Category');
    const eventDate = required(input.eventDate, 'Date and time');
    const location = required(input.location, 'Location');
    if (!Number.isInteger(input.capacity) || input.capacity < 1) fail('Capacity must be at least 1.');
    const status = input.status === 'cancelled' ? 'cancelled' : input.status === 'open' ? 'open' : '';
    if (!status) fail('Event status is not valid.');
    const id = existingId ?? randomUUID();
    if (existingId) {
      const current = db.prepare('SELECT id, baseline_registrations FROM events WHERE id = ?').get(existingId) as
        | { id: string; baseline_registrations: number }
        | undefined;
      if (!current) fail('Event not found.', 404);
      const registered = eventRegistrationCount(existingId, current.baseline_registrations);
      if (input.capacity < registered) fail('Capacity cannot be lower than the number of registrations.', 409);
      db.prepare(
        `UPDATE events SET name = ?, category = ?, description = ?, event_date = ?, location = ?, capacity = ?, status = ? WHERE id = ?`,
      ).run(name, category, input.description?.trim() ?? '', eventDate, location, input.capacity, status, id);
    } else {
      db.prepare(
        `INSERT INTO events (id, name, category, description, event_date, location, capacity, status, baseline_registrations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ).run(id, name, category, input.description?.trim() ?? '', eventDate, location, input.capacity, status);
    }
    storeResponse('event-admin', versionFor('event-admin', formVersionId), actor.id, response);
    return rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(id), true);
  });

  const registerForEvent = db.transaction((eventId: string, input: EventRegistrationInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) => {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
    if (!event) fail('Event not found.', 404);
    if (event.status !== 'open') fail('This event is not open for registration.', 409);
    const student = requireStudentByNumber(required(input.studentNumber, 'Student ID'));
    if (actor.role === 'student' && actor.studentId !== student.id) fail('You can only register yourself for an event.', 403);
    const registered = eventRegistrationCount(event.id, event.baseline_registrations);
    if (registered >= event.capacity) fail('This event is full.', 409);
    const existing = db.prepare('SELECT id FROM event_registrations WHERE student_id = ? AND event_id = ?').get(student.id, event.id);
    if (existing) fail('This student is already registered for the event.', 409);
    const versionId = versionFor('event-registration', formVersionId);
    db.prepare(
      `INSERT INTO event_registrations (
        id, student_id, event_id, area_of_interest, notes, registration_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'Registered', ?)`,
    ).run(randomUUID(), student.id, event.id, required(input.areaOfInterest, 'Area of interest'), input.notes?.trim() ?? '', nowIso(), versionId);
    storeResponse('event-registration', versionId, actor.id, response);
    return rowToEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(event.id), true);
  });

  const saveResidence = db.transaction((input: ResidenceInput, actor: AuthUser, formVersionId: string | undefined, response: unknown, existingId?: string) => {
    const name = required(input.name, 'Hall name');
    const category = required(input.category, 'Hall type');
    const location = required(input.location, 'Location');
    if (!HALL_CATEGORIES.includes(category)) fail('Hall type is not valid.');
    if (!Number.isInteger(input.capacity) || input.capacity < 1) fail('Capacity must be at least 1.');
    if (!Number.isInteger(input.weeklyRate) || input.weeklyRate < 0) fail('Weekly rate must be zero or more.');
    const status = input.status === 'closed' ? 'closed' : input.status === 'open' ? 'open' : '';
    if (!status) fail('Hall status is not valid.');
    const id = existingId ?? randomUUID();
    if (existingId) {
      const current = db.prepare('SELECT id, baseline_occupancy FROM residences WHERE id = ?').get(existingId) as
        | { id: string; baseline_occupancy: number }
        | undefined;
      if (!current) fail('Hall not found.', 404);
      const occupied = occupiedCount(existingId, current.baseline_occupancy);
      if (input.capacity < occupied) fail('Capacity cannot be lower than the number of residents.', 409);
      db.prepare(
        `UPDATE residences SET name = ?, category = ?, description = ?, location = ?, weekly_rate = ?, capacity = ?, status = ? WHERE id = ?`,
      ).run(name, category, input.description?.trim() ?? '', location, input.weeklyRate, input.capacity, status, id);
    } else {
      db.prepare(
        `INSERT INTO residences (id, name, category, description, location, weekly_rate, capacity, status, baseline_occupancy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      ).run(id, name, category, input.description?.trim() ?? '', location, input.weeklyRate, input.capacity, status);
    }
    storeResponse('accommodation-admin', versionFor('accommodation-admin', formVersionId), actor.id, response);
    return rowToResidence(db.prepare('SELECT * FROM residences WHERE id = ?').get(id), true);
  });

  const allocateResidence = db.transaction((residenceId: string, input: AllocationInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) => {
    const hall = db.prepare('SELECT * FROM residences WHERE id = ?').get(residenceId) as any;
    if (!hall) fail('Hall not found.', 404);
    if (input.residenceId && input.residenceId !== residenceId) fail('The selected hall does not match this request.');
    if (hall.status !== 'open') fail('This hall is not open for new places.', 409);
    if (!input.termsConfirmation) fail('Accept the hall licence terms to continue.');
    const roomType = required(input.roomType, 'Room type');
    const contract = required(input.contract, 'Contract length');
    if (!ROOM_TYPES.includes(roomType)) fail('Room type is not valid.');
    if (!CONTRACTS.includes(contract)) fail('Contract length is not valid.');
    const student = requireStudentByNumber(required(input.studentNumber, 'Student ID'));
    if (actor.role === 'student' && actor.studentId !== student.id) fail('You can only request a hall place for yourself.', 403);
    const occupied = occupiedCount(hall.id, hall.baseline_occupancy);
    if (occupied >= hall.capacity) fail('This hall is full.', 409);
    const existing = db.prepare(`SELECT id FROM accommodation_allocations WHERE student_id = ? AND status = 'Allocated'`).get(student.id);
    if (existing) fail('This student already has a hall place.', 409);
    const versionId = versionFor('accommodation-application', formVersionId);
    db.prepare(
      `INSERT INTO accommodation_allocations (
        id, student_id, residence_id, room_type, contract, notes, start_date, status, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Allocated', ?)`,
    ).run(randomUUID(), student.id, hall.id, roomType, contract, input.notes?.trim() ?? '', today(), versionId);
    storeResponse('accommodation-application', versionId, actor.id, response);
    return rowToResidence(db.prepare('SELECT * FROM residences WHERE id = ?').get(hall.id), true);
  });

  const saveAdvising = db.transaction(
    (studentId: string, input: AdvisingInput, actor: AuthUser, formVersionId: string | undefined, response: unknown, meetingId?: string) => {
      requireStudent(studentId);
      const meetingDate = required(input.meetingDate, 'Meeting date');
      const advisorId = required(input.advisorId, 'Assigned advisor');
      const topic = required(input.topic, 'Topic');
      const notes = required(input.notes, 'Meeting notes');
      requireAdvisor(advisorId);
      const versionId = versionFor('advising', formVersionId);
      if (meetingId) {
        const current = db.prepare('SELECT id, student_id FROM advising_meetings WHERE id = ?').get(meetingId) as
          | { id: string; student_id: string }
          | undefined;
        if (!current || current.student_id !== studentId) fail('Advising meeting not found.', 404);
        db.prepare(
          `UPDATE advising_meetings SET advisor_id = ?, meeting_date = ?, topic = ?, notes = ?, follow_up_date = ?, form_version_id = ?
           WHERE id = ?`,
        ).run(advisorId, meetingDate, topic, notes, input.followUpDate?.trim() ?? '', versionId, meetingId);
      } else {
        db.prepare(
          `INSERT INTO advising_meetings (id, student_id, advisor_id, meeting_date, topic, notes, follow_up_date, form_version_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(randomUUID(), studentId, advisorId, meetingDate, topic, notes, input.followUpDate?.trim() ?? '', versionId);
      }
      storeResponse('advising', versionId, actor.id, response);
      return advisingFor(studentId);
    },
  );

  const createSupport = db.transaction((studentId: string, input: SupportInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) => {
    requireStudent(studentId);
    if (actor.role === 'student' && actor.studentId !== studentId) fail('You can only create a request for your own record.', 403);
    const requestType = required(input.requestType, 'Request type');
    const description = required(input.description, 'Request description');
    const priority = required(input.priority, 'Priority');
    if (!SUPPORT_TYPES.includes(requestType)) fail('Request type is not valid.');
    if (!PRIORITIES.includes(priority)) fail('Priority is not valid.');
    const versionId = versionFor('support-request', formVersionId);
    const id = randomUUID();
    const stamp = nowIso();
    db.prepare(
      `INSERT INTO support_requests (
        id, student_id, request_type, description, priority, supporting_information, assigned_to, status, created_at, updated_at, form_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, '', 'Open', ?, ?, ?)`,
    ).run(id, studentId, requestType, description, priority, input.supportingInformation?.trim() ?? '', stamp, stamp, versionId);
    db.prepare(
      `INSERT INTO support_request_events (id, request_id, status, assigned_to, actor_id, created_at) VALUES (?, ?, 'Open', '', ?, ?)`,
    ).run(randomUUID(), id, actor.id, stamp);
    storeResponse('support-request', versionId, actor.id, response);
    return rowToSupport(db.prepare('SELECT * FROM support_requests WHERE id = ?').get(id));
  });

  const updateSupport = db.transaction((requestId: string, input: SupportUpdateInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) => {
    const current = db.prepare('SELECT * FROM support_requests WHERE id = ?').get(requestId) as any;
    if (!current) fail('Support request not found.', 404);
    if (!SUPPORT_STATUSES.includes(input.status)) fail('Status is not valid.');
    requireStaff(required(input.assignedTo, 'Assigned staff member'));
    const versionId = versionFor('support-status', formVersionId);
    const stamp = nowIso();
    db.prepare(`UPDATE support_requests SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ?`).run(
      input.status,
      input.assignedTo,
      stamp,
      requestId,
    );
    db.prepare(
      `INSERT INTO support_request_events (id, request_id, status, assigned_to, actor_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), requestId, input.status, input.assignedTo, actor.id, stamp);
    storeResponse('support-status', versionId, actor.id, response);
    return rowToSupport(db.prepare('SELECT * FROM support_requests WHERE id = ?').get(requestId));
  });

  function saveFormSchema(formId: string, schema: object, actor: AuthUser): StoredFormVersion {
    if (!FORM_IDS.has(formId)) fail('Unknown form.', 404);
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) fail('A form schema object is required.');
    const current = db.prepare('SELECT MAX(version_number) AS version_number FROM form_versions WHERE form_id = ?').get(formId) as {
      version_number: number | null;
    };
    const versionNumber = (current.version_number ?? 0) + 1;
    const id = randomUUID();
    const stamp = nowIso();
    const write = db.transaction(() => {
      db.prepare(
        `INSERT INTO form_versions (id, form_id, version_number, schema_json, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, formId, versionNumber, JSON.stringify(schema), actor.id, stamp);
      db.prepare(`UPDATE form_definitions SET active_version_id = ?, updated_at = ? WHERE id = ?`).run(id, stamp, formId);
    });
    write();
    return { id, formId, versionNumber, schema, createdBy: actor.id, createdAt: stamp };
  }

  function activeForms(): FormVersionInfo[] {
    return FORM_CATALOG.map((form) => {
      const row = db
        .prepare(
          `SELECT d.name, d.category, d.description, d.status, v.id AS version_id, v.version_number, v.schema_json
           FROM form_definitions d
           JOIN form_versions v ON v.id = d.active_version_id
           WHERE d.id = ?`,
        )
        .get(form.id) as any;
      return {
        id: form.id,
        name: row?.name ?? form.name,
        category: row?.category ?? form.category,
        description: row?.description ?? form.description,
        status: row?.status ?? 'active',
        versionId: row?.version_id ?? '',
        versionNumber: row?.version_number ?? 1,
        schema: row ? JSON.parse(row.schema_json) : form.schema,
      };
    });
  }

  return {
    close: () => db.close(),
    reset() {
      const wipe = db.transaction(() => {
        for (const table of RESET_TABLES) db.prepare(`DELETE FROM ${table}`).run();
        seedAll();
      });
      wipe();
    },
    resetDemo(actor: AuthUser): Session {
      this.reset();
      const token = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, actor.id);
      return { ...actor, token };
    },
    authenticate(username: string, password: string): Session | null {
      const row = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username.trim()) as any;
      const hash = row?.password_hash ?? hashPassword(DEMO_PASSWORD);
      if (!row || !passwordsMatch(password, hash)) return null;
      const token = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, row.id);
      return { ...publicUser(row), token };
    },
    logout(token: string) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },
    userByToken(token: string): AuthUser | null {
      const row = db
        .prepare(
          `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
        )
        .get(token) as any;
      return row ? publicUser(row) : null;
    },
    roster(): RosterEntry[] {
      return (db.prepare('SELECT * FROM users ORDER BY seq').all() as any[]).map((row) => ({
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        label: rosterLabel({ ...publicUser(row), seq: row.seq }),
      }));
    },
    departments(): Department[] {
      return db.prepare('SELECT id, name, description FROM departments ORDER BY name').all() as Department[];
    },
    programmes(): Programme[] {
      return (
        db
          .prepare(
            `SELECT p.id, p.name, p.department_id AS departmentId, d.name AS departmentName, p.description
             FROM programmes p JOIN departments d ON d.id = p.department_id
             ORDER BY p.name`,
          )
          .all() as Programme[]
      );
    },
    staff(): StaffMember[] {
      return (db.prepare(`SELECT id, full_name, role FROM users WHERE role != 'student' ORDER BY seq`).all() as any[]).map((row) => ({
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        label: row.full_name,
      }));
    },
    advisors(): StaffMember[] {
      return (
        db.prepare(`SELECT id, full_name, role FROM users WHERE role IN ('academic', 'administrator') ORDER BY seq`).all() as any[]
      ).map((row) => ({
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        label: row.full_name,
      }));
    },
    searchStudents,
    getProfile,
    createStudent: (input: StudentInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      writeStudent(input, actor, 'student-registration', formVersionId, response),
    updateStudent: (id: string, input: StudentInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      writeStudent(input, actor, 'edit-student', formVersionId, response, id),
    deleteStudent(id: string) {
      const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
      if (result.changes === 0) fail('Student not found.', 404);
    },
    courses: () => (db.prepare(`${courseSelect} ORDER BY c.course_code`).all() as any[]).map(rowToCourse),
    course: (id: string) => {
      const row = db.prepare(`${courseSelect} WHERE c.id = ?`).get(id);
      if (!row) fail('Course not found.', 404);
      return rowToCourse(row);
    },
    createCourse: (input: CourseInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveCourse(input, actor, formVersionId, response),
    updateCourse: (id: string, input: CourseInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveCourse(input, actor, formVersionId, response, id),
    registerForCourse,
    events: () => (db.prepare('SELECT * FROM events ORDER BY event_date, name').all() as any[]).map((row) => rowToEvent(row, false)),
    event: (id: string) => {
      const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
      if (!row) fail('Event not found.', 404);
      return rowToEvent(row, true);
    },
    createEvent: (input: EventInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveEvent(input, actor, formVersionId, response),
    updateEvent: (id: string, input: EventInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveEvent(input, actor, formVersionId, response, id),
    registerForEvent,
    residences: () => (db.prepare('SELECT * FROM residences ORDER BY name').all() as any[]).map((row) => rowToResidence(row, false)),
    residence: (id: string) => {
      const row = db.prepare('SELECT * FROM residences WHERE id = ?').get(id);
      if (!row) fail('Hall not found.', 404);
      return rowToResidence(row, true);
    },
    createResidence: (input: ResidenceInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveResidence(input, actor, formVersionId, response),
    updateResidence: (id: string, input: ResidenceInput, actor: AuthUser, formVersionId: string | undefined, response: unknown) =>
      saveResidence(input, actor, formVersionId, response, id),
    allocateResidence,
    advising: advisingFor,
    saveAdvising,
    supportRequests: supportFor,
    createSupport,
    updateSupport,
    forms: activeForms,
    formVersions(formId: string): StoredFormVersion[] {
      if (!FORM_IDS.has(formId)) fail('Unknown form.', 404);
      return (db.prepare('SELECT * FROM form_versions WHERE form_id = ? ORDER BY version_number').all(formId) as any[]).map((row) => ({
        id: row.id,
        formId: row.form_id,
        versionNumber: row.version_number,
        schema: JSON.parse(row.schema_json),
        createdBy: row.created_by,
        createdAt: row.created_at,
      }));
    },
    saveFormSchema,
    submitResponse(formId: string, formVersionId: string | undefined, actor: AuthUser, response: unknown) {
      const versionId = versionFor(formId, formVersionId);
      storeResponse(formId, versionId, actor.id, response);
      return { id: formId, formVersionId: versionId };
    },
    responses(formId: string) {
      return db.prepare('SELECT id, form_id, form_version_id, response_json, submitted_at FROM form_responses WHERE form_id = ?').all(formId);
    },
    counts() {
      return {
        students: (db.prepare('SELECT COUNT(*) AS count FROM students').get() as { count: number }).count,
        responses: (db.prepare('SELECT COUNT(*) AS count FROM form_responses').get() as { count: number }).count,
      };
    },
  };
}
