import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SurveyDialog } from '../components/forms/SurveyDialog';
import { campusRepository } from '../repositories/campusRepository';
import { Course } from '../types/campus';
import { AuthUser } from '../types/auth';
import { FormId } from '../types/forms';
import { canManageCatalog, canRegisterCourses } from '../ui/access';
import { Breadcrumbs, Button, emptyPanelClass, PageHeading, panelClass, PanelHeading, Pill, useDocumentTitle } from '../ui/components';
import { placesLabel } from '../ui/format';

interface CoursesPageProps {
  user: AuthUser;
  onOpenFormBuilder: (formId: FormId, onReturn?: () => void) => void;
  showToast: (message: string) => void;
  ownStudentNumber?: string;
}

type DialogState = { kind: 'edit'; course?: Course } | { kind: 'register'; course: Course };

export const CoursesPage: React.FC<CoursesPageProps> = ({ user, onOpenFormBuilder, showToast, ownStudentNumber }) => {
  const { courseId } = useParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const course = courses.find((item) => item.id === courseId);
  useDocumentTitle(course ? course.courseCode : 'Courses');

  useEffect(() => {
    const load = () =>
      campusRepository
        .courses()
        .then((rows) => {
          setCourses(rows);
          setError('');
        })
        .catch((loadError: Error) => setError(loadError.message))
        .finally(() => setLoading(false));
    load();
    return campusRepository.subscribe(load);
  }, []);

  if (courseId && !loading && !course) {
    return (
      <section className={emptyPanelClass}>
        <h2 className="text-base font-semibold">Course not found</h2>
        <Link to="/courses" className="mt-3 inline-flex text-primary">
          Back to courses
        </Link>
      </section>
    );
  }

  return (
    <>
      {course ? (
        <>
          <Breadcrumbs items={[{ label: 'Courses', path: '/courses' }, { label: course.courseCode }]} />
          <PageHeading title={`${course.courseCode} · ${course.name}`} description={course.departmentName} icon="book" />
          <div className="mb-5 flex flex-wrap gap-2">
            {canRegisterCourses(user.role) && course.status === 'active' && (
              <Button variant="primary" onClick={() => setDialog({ kind: 'register', course })}>
                Register Student
              </Button>
            )}
            {canManageCatalog(user.role) && (
              <Button icon="edit-2" onClick={() => setDialog({ kind: 'edit', course })}>
                Edit Course
              </Button>
            )}
          </div>
          <section className={panelClass}>
            <PanelHeading title="Course Details" icon="book">
              <Pill tone={course.status === 'active' ? 'brand' : 'neutral'}>{course.status === 'active' ? 'Active' : 'Inactive'}</Pill>
            </PanelHeading>
            <div className="grid gap-4 px-5 py-5 text-sm md:grid-cols-2 md:px-6">
              <p><span className="text-muted-foreground">Semester · </span>{course.semester}</p>
              <p><span className="text-muted-foreground">Credits · </span>{course.credits}</p>
              <p><span className="text-muted-foreground">Instructor · </span>{course.instructor}</p>
              <p><span className="text-muted-foreground">Places · </span>{placesLabel(course.availablePlaces, course.capacity)}</p>
              <p className="md:col-span-2">{course.description}</p>
              <p className="md:col-span-2">
                <span className="text-muted-foreground">Prerequisites · </span>
                {course.prerequisites.length ? course.prerequisites.map((item) => `${item.courseCode} ${item.name}`).join(', ') : 'None'}
              </p>
            </div>
          </section>
        </>
      ) : (
        <>
          <PageHeading
            title="Courses"
            description="Open a course to see its places, prerequisites, and registrations."
            icon="book"
            action={
              canManageCatalog(user.role) ? (
                <Button variant="primary" icon="plus" onClick={() => setDialog({ kind: 'edit' })}>
                  Create Course
                </Button>
              ) : undefined
            }
          />
          {error && <p className="mb-4 text-danger">{error}</p>}
          {loading ? (
            <p className="text-muted-foreground">Loading courses…</p>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2">
              {courses.map((item) => (
                <Link key={item.id} to={`/courses/${item.id}`} className={`${panelClass} block px-5 py-4.5 hover:bg-card-hover md:px-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-primary">{item.courseCode}</p>
                      <h2 className="mt-1 text-base font-semibold">{item.name}</h2>
                    </div>
                    <Pill tone={item.availablePlaces > 0 && item.status === 'active' ? 'brand' : 'neutral'}>
                      {item.status === 'active' ? `${item.availablePlaces} open` : 'Inactive'}
                    </Pill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.semester} · {item.credits} credits · {item.instructor}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'edit' && (
        <SurveyDialog
          formId="course-admin"
          heading={dialog.course ? 'Edit Course' : 'Create Course'}
          data={
            dialog.course
              ? {
                  course_code: dialog.course.courseCode,
                  name: dialog.course.name,
                  department_id: dialog.course.departmentId,
                  semester: dialog.course.semester,
                  credits: dialog.course.credits,
                  capacity: dialog.course.capacity,
                  instructor: dialog.course.instructor,
                  status: dialog.course.status === 'inactive' ? 'Inactive' : 'Active',
                  description: dialog.course.description,
                  prerequisites: dialog.course.prerequisites.map((item) => item.courseCode),
                }
              : { status: 'Active' }
          }
          onClose={() => setDialog(null)}
          onCustomize={() => onOpenFormBuilder('course-admin', () => setDialog(dialog))}
          onSave={async (data) => {
            await campusRepository.saveCourse(data, dialog.course?.id);
            showToast('Course saved.');
          }}
          configure={(model) => {
            if (dialog.course) {
              const question = model.getQuestionByName('course_code');
              if (question) question.readOnly = true;
            }
          }}
        />
      )}
      {dialog?.kind === 'register' && (
        <SurveyDialog
          formId="course-registration"
          heading={`Register for ${dialog.course.courseCode}`}
          description={placesLabel(dialog.course.availablePlaces, dialog.course.capacity)}
          data={{ course_code: dialog.course.courseCode, student_number: ownStudentNumber ?? '' }}
          onClose={() => setDialog(null)}
          onCustomize={() => onOpenFormBuilder('course-registration', () => setDialog(dialog))}
          configure={(model) => {
            const question = model.getQuestionByName('course_code');
            if (question) question.readOnly = true;
          }}
          onSave={async (data) => {
            await campusRepository.registerForCourse(dialog.course.id, data);
            showToast('Course registration saved.');
          }}
        />
      )}
    </>
  );
};
