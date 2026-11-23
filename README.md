# Acme Campus

A campus management demo. SurveyJS Form Library renders every business form. SurveyJS Creator edits those forms. Student, course, event, advising, and support records are stored in SQLite through a small Express API.

Survey Creator is a commercial product. The form builder runs without a license key and shows the SurveyJS banner. Set `SURVEYJS_KEY` to your developer license key to remove that banner. Copy `.env.example` to `.env.local` for a local key. Form Library does not need a key.

Saving a form in Creator stores a new JSON schema version. It does not create a student, course registration, or other business record. The next time that workflow opens, Form Library loads the saved schema. Earlier responses keep the version they were submitted with.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3002. The API listens on port 4002 and stores `data/campus.db`.

Sign in with any seeded account. Every password is `demo1234`.

| Username | Role | Opens |
| --- | --- | --- |
| `sophie.wilson` | Administrator | Student directory |
| `james.patel` | Academic staff | Student directory |
| `amira.khan` | Student support | Student directory |
| `emma.thompson` | Student | Emma Thompson (`STU-1002`) |
| `liam.thompson` | Student | Liam Thompson (`STU-1077`) |

The roster dropdown fills the username and password. “Keep me signed in on this device” stores the account in `localStorage`. Otherwise the session ends when the tab closes.

Accommodation is shown in the navigation and stays disabled. That module is outside this demo.

## What you can do

- Search students by surname, date of birth, or student ID. An empty search lists the directory. `Thompson` returns Emma and Liam.
- Register and edit students. A duplicate student ID is rejected.
- Open a profile with contact details, course registrations, advising meetings, and support requests.
- Register a student for a course. The API checks that the student and course exist, that a place is free, that prerequisites are met, and that the student is not already registered.
- Create, edit, and deactivate courses.
- Open Career Fair 2026 (42 registrations) and Open Day Welcome Session (28 registrations). Register a student, or cancel an event.
- Add and edit advising meetings.
- Create a support request, filter by status and type, and update the status. Each change stays in the request history.
- Open **Customize Form** on a workflow, change the schema in Survey Creator, and save it. The same workflow renders the saved schema.

`SEM0001 Campus Skills Workshop` has one place and is already full, so a registration attempt shows the capacity check.

## Scripts

```bash
npm run build
npm run preview
npm run lint
npm run test:unit
```

To reset the demo data, stop the server and delete `data/campus.db`, or call `POST /api/admin/reset`.

## Layout

```text
server/           Express API and SQLite schema
src/pages/        Sign-in, students, courses, events
src/survey/       Form Library renderer, Creator dialog, JSON schemas
src/repositories/ API clients and survey-to-record mapping
src/theme/        Campus palette shared by the app and SurveyJS
tests/unit/       API workflows and mapping
```
