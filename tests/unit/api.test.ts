import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../server/app';
import { CampusDb, createDb } from '../../server/db';
import { DEMO_PASSWORD } from '../../src/data/initialData';
import { studentFromSurvey } from '../../src/repositories/surveyMapping';

let db: CampusDb;
let server: Server;
let baseUrl: string;

async function api(path: string, init?: RequestInit, token?: string) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${baseUrl}/api${path}`, { ...init, headers });
}

async function login(username: string) {
  const response = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password: DEMO_PASSWORD }),
  });
  expect(response.status).toBe(200);
  return (await response.json()).token as string;
}

beforeAll(async () => {
  db = createDb(':memory:');
  server = createApp(db).listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(() => {
  db.reset();
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
});

describe('campus API', () => {
  it('requires a sign-in for student records', async () => {
    const response = await api('/students');
    expect(response.status).toBe(401);
  });

  it('searches by surname, date of birth, and student ID', async () => {
    const token = await login('sophie.wilson');
    const bySurname = await api('/students?surname=thompson', undefined, token);
    const surnames = await bySurname.json();
    expect(surnames.map((student: { studentNumber: string }) => student.studentNumber).sort()).toEqual(['STU-1002', 'STU-1077']);

    const byDate = await api('/students?dateOfBirth=2004-04-12', undefined, token);
    expect(await byDate.json()).toMatchObject([{ studentNumber: 'STU-1002' }]);

    const byId = await api('/students?studentNumber=STU-1108', undefined, token);
    expect(await byId.json()).toMatchObject([{ firstName: 'Priya' }]);
  });

  it('registers a student and rejects a duplicate student ID', async () => {
    const token = await login('sophie.wilson');
    const record = studentFromSurvey({
      first_name: 'Ada',
      last_name: 'Lopez',
      date_of_birth: '2004-03-03',
      student_number: 'STU-2001',
      programme_id: 'prog-cs',
      department_id: 'dept-cs',
      email: 'ada.lopez@acme.edu',
      phone: '',
      address: '1 New Court',
    });
    const created = await api('/students', { method: 'POST', body: JSON.stringify({ record, response: record }) }, token);
    expect(created.status).toBe(201);
    const student = await created.json();
    expect(student.studentNumber).toBe('STU-2001');

    const duplicate = await api('/students', { method: 'POST', body: JSON.stringify({ record, response: record }) }, token);
    expect(duplicate.status).toBe(409);

    const academic = await login('james.patel');
    const forbidden = await api('/students', { method: 'POST', body: JSON.stringify({ record, response: record }) }, academic);
    expect(forbidden.status).toBe(403);
  });

  it('registers a course when prerequisites and capacity allow it', async () => {
    const token = await login('james.patel');
    const courses = await (await api('/courses', undefined, token)).json();
    const database = courses.find((course: { courseCode: string }) => course.courseCode === 'COMP2003');
    const before = database.availablePlaces;
    const created = await api(
      `/courses/${database.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            studentNumber: 'STU-1002',
            courseCode: 'COMP2003',
            enrollmentType: 'Standard',
            notes: 'After the AI module',
            prerequisiteConfirmation: true,
          },
          response: { student_number: 'STU-1002' },
        }),
      },
      token,
    );
    expect(created.status).toBe(201);
    expect((await created.json()).availablePlaces).toBe(before - 1);

    const profile = await (await api('/students/stu-emma', undefined, token)).json();
    expect(profile.courses.map((course: { courseCode: string }) => course.courseCode)).toContain('COMP2003');
  });

  it('rejects a missing prerequisite, a duplicate, and a full course', async () => {
    const token = await login('sophie.wilson');
    const courses = await (await api('/courses', undefined, token)).json();
    const security = courses.find((course: { courseCode: string }) => course.courseCode === 'COMP3015');
    const full = courses.find((course: { courseCode: string }) => course.courseCode === 'SEM0001');
    const intro = courses.find((course: { courseCode: string }) => course.courseCode === 'COMP1001');

    const missing = await api(
      `/courses/${security.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            studentNumber: 'STU-1002',
            courseCode: 'COMP3015',
            enrollmentType: 'Standard',
            notes: '',
            prerequisiteConfirmation: true,
          },
        }),
      },
      token,
    );
    expect(missing.status).toBe(409);
    expect((await missing.json()).error).toContain('COMP2003');

    const duplicate = await api(
      `/courses/${intro.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            studentNumber: 'STU-1002',
            courseCode: 'COMP1001',
            enrollmentType: 'Elective',
            notes: '',
            prerequisiteConfirmation: true,
          },
        }),
      },
      token,
    );
    expect(duplicate.status).toBe(409);

    const noPlaces = await api(
      `/courses/${full.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            studentNumber: 'STU-1108',
            courseCode: 'SEM0001',
            enrollmentType: 'Standard',
            notes: '',
            prerequisiteConfirmation: true,
          },
        }),
      },
      token,
    );
    expect(noPlaces.status).toBe(409);
    expect((await noPlaces.json()).error).toMatch(/available places/i);
  });

  it('registers an event once and keeps the published count', async () => {
    const token = await login('sophie.wilson');
    const events = await (await api('/events', undefined, token)).json();
    const fair = events.find((event: { name: string }) => event.name === 'Career Fair 2026');
    expect(fair.registeredCount).toBe(42);

    const created = await api(
      `/events/${fair.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: { studentNumber: 'STU-1108', areaOfInterest: 'Careers', notes: 'Employer stands' },
          response: { student_number: 'STU-1108' },
        }),
      },
      token,
    );
    expect(created.status).toBe(201);
    expect((await created.json()).registeredCount).toBe(43);

    const duplicate = await api(
      `/events/${fair.id}/registrations`,
      {
        method: 'POST',
        body: JSON.stringify({
          record: { studentNumber: 'STU-1108', areaOfInterest: 'Careers', notes: '' },
        }),
      },
      token,
    );
    expect(duplicate.status).toBe(409);
  });

  it('keeps advising meetings in date order and allows an edit', async () => {
    const token = await login('james.patel');
    const before = await (await api('/students/stu-emma/advising', undefined, token)).json();
    expect(before.map((meeting: { meetingDate: string }) => meeting.meetingDate)).toEqual(['2026-01-15', '2026-02-12']);

    const created = await api(
      '/students/stu-emma/advising',
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            meetingDate: '2026-03-01',
            advisorId: 'user-james',
            topic: 'Summer options',
            notes: 'Discuss a project supervisor.',
            followUpDate: '',
          },
        }),
      },
      token,
    );
    expect(created.status).toBe(201);
    const meetings = await created.json();
    const added = meetings[meetings.length - 1];
    const updated = await api(
      `/advising/${added.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          studentId: 'stu-emma',
          record: { ...added, meetingDate: added.meetingDate, advisorId: 'user-james', topic: 'Project supervisor', notes: added.notes, followUpDate: '2026-03-20' },
        }),
      },
      token,
    );
    expect(updated.status).toBe(200);
    expect((await updated.json()).at(-1).topic).toBe('Project supervisor');
  });

  it('creates a support request, filters it, and keeps status history', async () => {
    const token = await login('amira.khan');
    const created = await api(
      '/students/stu-priya/support-requests',
      {
        method: 'POST',
        body: JSON.stringify({
          record: {
            requestType: 'Technical Support',
            description: 'Cannot sign in to the lab image.',
            priority: 'High',
            supportingInformation: '',
          },
        }),
      },
      token,
    );
    expect(created.status).toBe(201);
    const request = await created.json();
    const updated = await api(
      `/support-requests/${request.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ record: { status: 'In Progress', assignedTo: 'user-amira' } }),
      },
      token,
    );
    const saved = await updated.json();
    expect(saved.history.map((event: { status: string }) => event.status)).toEqual(['Open', 'In Progress']);

    const filtered = await api('/students/stu-priya/support-requests?status=Open&requestType=Academic%20Support', undefined, token);
    expect(await filtered.json()).toEqual([]);

    const academic = await login('james.patel');
    const forbidden = await api(
      `/support-requests/${request.id}`,
      { method: 'PUT', body: JSON.stringify({ record: { status: 'Closed', assignedTo: 'user-amira' } }) },
      academic,
    );
    expect(forbidden.status).toBe(403);
  });

  it('stores a new form version without creating a student and keeps the old response', async () => {
    const token = await login('sophie.wilson');
    const before = db.counts().students;
    const versions = await (await api('/forms/student-registration/versions', undefined, token)).json();
    const firstVersion = versions[0].id;
    await api(
      '/forms/student-registration/responses',
      { method: 'POST', body: JSON.stringify({ formVersionId: firstVersion, response: { student_number: 'STU-9000' } }) },
      token,
    );

    const saved = await api(
      '/forms/student-registration/versions',
      { method: 'POST', body: JSON.stringify({ schema: { title: 'Custom registration', pages: [{ name: 'page', elements: [] }] } }) },
      token,
    );
    expect(saved.status).toBe(201);
    const version = await saved.json();
    expect(version.versionNumber).toBe(2);
    expect(db.counts().students).toBe(before);

    const responses = db.responses('student-registration') as { form_version_id: string; response_json: string }[];
    expect(responses[0].form_version_id).toBe(firstVersion);
    expect(JSON.parse(responses[0].response_json).student_number).toBe('STU-9000');

    const active = (await (await api('/forms')).json()).find((form: { id: string }) => form.id === 'student-registration');
    expect(active.versionId).toBe(version.id);
    expect(active.schema.title).toBe('Custom registration');
  });

  it('hides other students from a student account', async () => {
    const token = await login('emma.thompson');
    const students = await (await api('/students', undefined, token)).json();
    expect(students).toHaveLength(1);
    expect(students[0].id).toBe('stu-emma');
    const other = await api('/students/stu-liam', undefined, token);
    expect(other.status).toBe(403);
  });
});
