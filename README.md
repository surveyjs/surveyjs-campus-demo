# Acme Campus

A campus management demo. SurveyJS Form Library renders every business form. SurveyJS Creator edits those forms. Student, course, event, advising, and support records are stored in SQLite through a small Express API.

## Appearance

The page is styled with Tailwind CSS v4 and the current shadcn/ui default. `shadcn init` writes three choices: visual style Base Nova, base color Neutral, and the Theme menu entry named Default. That Theme entry is a neutral primary (`oklch(0.205 0 0)` in light mode). The token values in `src/styles.css` are the neutral scaffold from the shadcn theming docs. Tailwind utilities such as `bg-primary` and `text-foreground` point at those tokens.

The customizer has two different items named Default. The visual-style list contains Default (legacy) and New York (legacy). Those are older visual styles. This demo loads `shadcn-base-nova.css` and leaves both legacy visual styles unused. The Theme menu entry named Default is the neutral primary above. It is the theme color this demo uses.

SurveyJS Form Library does not use a built-in SurveyJS theme. `src/survey/SurveyRenderer.tsx` loads, in order:

1. `survey-core/survey-core.min.css`
2. `survey-core/themes/adapters/shadcn-base-nova.css`
3. `survey-core/themes/adapters/icons/lucide`

The shadcn adapter maps the same CSS variables onto the form controls, so a form matches the page. The Light / Dark control sets `data-theme` and the `dark` class on the document. Both the Tailwind shell and the forms follow that switch. Survey Creator reads the same tokens for its panes.

This is a different stack from the other SurveyJS demos. The HR demo uses Material UI and the MUI adapter. The Healthcare demo uses a custom green Tailwind palette.

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

Accommodation lists halls of residence. A student can hold one hall place. West Annex starts full so a new request is rejected.

## What you can do

- Search students by name, date of birth, or student ID. A name can be a first name, a surname, or the full name. An empty search lists the directory. `Thompson` returns Emma and Liam. `Emma Thompson` returns Emma.
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
src/theme/        Light/dark switch and Survey Creator colors
src/styles.css    Tailwind theme and shadcn color tokens
tests/unit/       API workflows and mapping
```
