import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/common/Dialog';
import { SurveyDialog } from '../components/forms/SurveyDialog';
import { campusRepository } from '../repositories/campusRepository';
import { AdvisingMeeting, StudentProfile, SupportRequest } from '../types/campus';
import { AuthUser } from '../types/auth';
import { FormId } from '../types/forms';
import { canAdvise, canEditStudents, canRegisterCourses, canUpdateSupport } from '../ui/access';
import { Breadcrumbs, Button, emptyPanelClass, PageHeading, panelClass, PanelHeading, Pill, useDocumentTitle } from '../ui/components';
import { formatDate, fullName } from '../ui/format';
import { studentToSurvey } from '../repositories/surveyMapping';

interface StudentProfilePageProps {
  studentId: string;
  user: AuthUser;
  onOpenFormBuilder: (formId: FormId, onReturn?: () => void) => void;
  showToast: (message: string) => void;
  portal?: boolean;
}

type DialogState =
  | { kind: 'edit' }
  | { kind: 'advising'; meeting?: AdvisingMeeting }
  | { kind: 'support' }
  | { kind: 'support-status'; request: SupportRequest }
  | { kind: 'course' }
  | { kind: 'delete' };

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 wrap-anywhere">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  studentId,
  user,
  onOpenFormBuilder,
  showToast,
  portal = false,
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  useDocumentTitle(profile ? fullName(profile.firstName, profile.lastName) : 'Student');

  const load = () => {
    setLoading(true);
    campusRepository
      .student(studentId)
      .then((next) => {
        setProfile(next);
        setError('');
      })
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    return campusRepository.subscribe(load);
    // Reload when the open student changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (loading && !profile) return <p className="text-muted-foreground">Loading student record…</p>;
  if (error || !profile) {
    return (
      <section className={emptyPanelClass}>
        <h2 className="text-base font-semibold">Student record unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'This student was not found.'}</p>
      </section>
    );
  }

  const name = fullName(profile.firstName, profile.lastName);
  const requests = profile.supportRequests.filter((request) => {
    if (statusFilter && request.status !== statusFilter) return false;
    if (typeFilter && request.requestType !== typeFilter) return false;
    return true;
  });
  const openBuilder = (formId: FormId, next: DialogState) => onOpenFormBuilder(formId, () => setDialog(next));

  return (
    <>
      {!portal && <Breadcrumbs items={[{ label: 'Manage Students', path: '/manage' }, { label: name }]} />}
      <PageHeading title={name} description={`${profile.studentNumber} · ${profile.programmeName}`} icon="user" />
      <div className="mb-5 flex flex-wrap gap-2">
        {canEditStudents(user.role) && (
          <Button icon="edit-2" onClick={() => setDialog({ kind: 'edit' })}>
            Edit Student
          </Button>
        )}
        {canAdvise(user.role) && (
          <Button icon="calendar" onClick={() => setDialog({ kind: 'advising' })}>
            Add Advising Meeting
          </Button>
        )}
        <Button icon="file-plus" onClick={() => setDialog({ kind: 'support' })}>
          Create Support Request
        </Button>
        {canRegisterCourses(user.role) && (
          <Button icon="book" onClick={() => setDialog({ kind: 'course' })}>
            Register for Another Course
          </Button>
        )}
        {canEditStudents(user.role) && (
          <Button variant="danger" onClick={() => setDialog({ kind: 'delete' })}>
            Remove Student
          </Button>
        )}
      </div>

      <section className={`${panelClass} mb-4`}>
        <PanelHeading title="Basic Details" icon="user" />
        <div className="px-5 py-5 md:px-6">
          <Facts
            items={[
              ['Student ID', profile.studentNumber],
              ['Full name', name],
              ['Date of birth', formatDate(profile.dateOfBirth)],
              ['Programme', profile.programmeName],
              ['Department', profile.departmentName],
              ['Academic year', profile.academicYear],
              ['Enrollment status', profile.status],
            ]}
          />
        </div>
      </section>

      <section className={`${panelClass} mb-4`}>
        <PanelHeading title="Contact Details" icon="file-text" />
        <div className="px-5 py-5 md:px-6">
          <Facts
            items={[
              ['Phone', profile.phone],
              ['Email', profile.email],
              ['Address', profile.address],
            ]}
          />
        </div>
      </section>

      <section className={`${panelClass} mb-4`}>
        <PanelHeading title="Course Registrations" icon="book" />
        <div className="px-5 py-5 md:px-6">
          {profile.courses.length ? (
            <ul className="flex flex-col gap-3">
              {profile.courses.map((course) => (
                <li key={course.id} className="rounded-md border border-border px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/courses/${course.courseId}`} className="font-semibold text-primary">
                      {course.courseCode} · {course.courseName}
                    </Link>
                    <Pill>{course.status}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.semester} · {course.enrollmentType} · {formatDate(course.registrationDate)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No course registrations yet.</p>
          )}
        </div>
      </section>

      <section className={`${panelClass} mb-4`}>
        <PanelHeading title="Academic Advising" icon="calendar" />
        <div className="px-5 py-5 md:px-6">
          {profile.advising.length ? (
            <ul className="flex flex-col gap-3">
              {profile.advising.map((meeting) => (
                <li key={meeting.id} className="rounded-md border border-border px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{meeting.topic}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(meeting.meetingDate)} · {meeting.advisorName}
                        {meeting.followUpDate ? ` · Follow-up ${formatDate(meeting.followUpDate)}` : ''}
                      </p>
                    </div>
                    {canAdvise(user.role) && (
                      <Button size="sm" onClick={() => setDialog({ kind: 'advising', meeting })}>
                        Edit
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{meeting.notes}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No advising meetings yet.</p>
          )}
        </div>
      </section>

      <section className={panelClass}>
        <PanelHeading title="Support Requests" icon="clipboard" />
        <div className="px-5 py-5 md:px-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <label className="text-xs text-muted-foreground">
              Status
              <select
                className="mt-1 block min-h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Request type
              <select
                className="mt-1 block min-h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="">All types</option>
                {['Academic Support', 'Accessibility Support', 'Financial Support', 'Personal Support', 'Technical Support'].map(
                  (type) => (
                    <option key={type}>{type}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          {requests.length ? (
            <ul className="flex flex-col gap-3">
              {requests.map((request) => (
                <li key={request.id} className="rounded-md border border-border px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{request.requestType}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(request.createdAt)} · {request.priority}
                        {request.assignedToName ? ` · ${request.assignedToName}` : ' · Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill>{request.status}</Pill>
                      {canUpdateSupport(user.role) && (
                        <Button size="sm" onClick={() => setDialog({ kind: 'support-status', request })}>
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{request.description}</p>
                  {request.supportingInformation && <p className="mt-1 text-xs text-muted-foreground">{request.supportingInformation}</p>}
                  {request.history.length > 1 && (
                    <ol className="mt-3 border-t border-border-subtle pt-2 text-xs text-muted-foreground">
                      {request.history.map((event) => (
                        <li key={event.id}>
                          {formatDate(event.createdAt)} · {event.status}
                          {event.assignedToName ? ` · ${event.assignedToName}` : ''}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No support requests match these filters.</p>
          )}
        </div>
      </section>

      {dialog?.kind === 'edit' && (
        <SurveyDialog
          formId="edit-student"
          heading="Edit Student"
          data={studentToSurvey(profile)}
          onClose={() => setDialog(null)}
          onCustomize={() => openBuilder('edit-student', dialog)}
          onSave={async (data) => {
            await campusRepository.updateStudent(profile.id, data);
            showToast('Student updated.');
          }}
        />
      )}
      {dialog?.kind === 'advising' && (
        <SurveyDialog
          formId="advising"
          heading={dialog.meeting ? 'Edit Advising Meeting' : 'Add Advising Meeting'}
          data={
            dialog.meeting
              ? {
                  meeting_date: dialog.meeting.meetingDate,
                  advisor_id: dialog.meeting.advisorId,
                  topic: dialog.meeting.topic,
                  notes: dialog.meeting.notes,
                  follow_up_date: dialog.meeting.followUpDate,
                }
              : undefined
          }
          onClose={() => setDialog(null)}
          onCustomize={() => openBuilder('advising', dialog)}
          onSave={async (data) => {
            await campusRepository.saveAdvising(profile.id, data, dialog.meeting?.id);
            showToast('Advising meeting saved.');
          }}
        />
      )}
      {dialog?.kind === 'support' && (
        <SurveyDialog
          formId="support-request"
          heading="Create Support Request"
          onClose={() => setDialog(null)}
          onCustomize={() => openBuilder('support-request', dialog)}
          onSave={async (data) => {
            await campusRepository.saveSupport(profile.id, data);
            showToast('Support request created.');
          }}
        />
      )}
      {dialog?.kind === 'support-status' && (
        <SurveyDialog
          formId="support-status"
          heading="Update Support Request"
          data={{ status: dialog.request.status, assigned_to: dialog.request.assignedTo }}
          onClose={() => setDialog(null)}
          onCustomize={() => openBuilder('support-status', dialog)}
          onSave={async (data) => {
            await campusRepository.updateSupport(dialog.request.id, data);
            showToast('Support request updated.');
          }}
        />
      )}
      {dialog?.kind === 'course' && (
        <SurveyDialog
          formId="course-registration"
          heading="Register for a Course"
          data={{ student_number: profile.studentNumber }}
          onClose={() => setDialog(null)}
          onCustomize={() => openBuilder('course-registration', dialog)}
          configure={(model) => {
            const question = model.getQuestionByName('student_number');
            if (question) question.readOnly = true;
          }}
          onSave={async (data) => {
            const code = String(data.course_code ?? '');
            const course = (await campusRepository.courses()).find((item) => item.courseCode === code);
            if (!course) throw new Error('Select a course.');
            await campusRepository.registerForCourse(course.id, data);
            showToast('Course registration saved.');
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Modal
          heading="Remove student"
          description="This deletes the student record and the related registrations, meetings, and requests."
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button onClick={() => setDialog(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  campusRepository
                    .deleteStudent(profile.id)
                    .then(() => {
                      showToast('Student removed.');
                      window.location.assign('/manage');
                    })
                    .catch((deleteError: Error) => setError(deleteError.message));
                }}
              >
                Remove Student
              </Button>
            </>
          }
        >
          <p>Remove {name} ({profile.studentNumber}) from the campus records?</p>
        </Modal>
      )}
    </>
  );
};
