import React, { useEffect, useRef, useState } from 'react';
import { ActionContainer, Model } from 'survey-core';
import { StudentCard } from '../components/students/StudentCard';
import { campusRepository } from '../repositories/campusRepository';
import { demoPrefill } from '../survey/demoPrefill';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { Student } from '../types/campus';
import { FormId } from '../types/forms';
import { editFormAction, emptyPanelClass, PageHeading, panelClass, useDocumentTitle, useFormSchema, cx } from '../ui/components';
import { Icon } from '../ui/Icon';

interface ManageStudentsPageProps {
  canCustomize: boolean;
  onOpenFormBuilder: (formId: FormId) => void;
}

interface Query {
  name: string;
  dateOfBirth: string;
  studentNumber: string;
}

const EMPTY: Query = { name: '', dateOfBirth: '', studentNumber: '' };
let lastQuery: Query = EMPTY;

const queryFromSurvey = (data: Record<string, unknown>): Query => ({
  name: String(data.name ?? data.surname ?? ''),
  dateOfBirth: String(data.date_of_birth ?? ''),
  studentNumber: String(data.student_number ?? ''),
});

function matches(student: Student, query: Query): boolean {
  const name = query.name.trim().toLowerCase().replace(/\s+/g, ' ');
  const studentNumber = query.studentNumber.trim().toLowerCase();
  if (name) {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const reversedName = `${student.lastName} ${student.firstName}`.toLowerCase();
    if (!fullName.includes(name) && !reversedName.includes(name)) return false;
  }
  if (query.dateOfBirth && student.dateOfBirth !== query.dateOfBirth) return false;
  if (studentNumber && !student.studentNumber.toLowerCase().includes(studentNumber)) return false;
  return true;
}

export const ManageStudentsPage: React.FC<ManageStudentsPageProps> = ({ canCustomize, onOpenFormBuilder }) => {
  useDocumentTitle('Manage Students');
  const schema = useFormSchema('student-search');
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQueryState] = useState(lastQuery);
  const [error, setError] = useState('');
  const searchModel = useRef<Model | null>(null);

  const setQuery = (next: Query) => {
    lastQuery = next;
    setQueryState(next);
  };

  useEffect(() => {
    const load = () =>
      campusRepository
        .students()
        .then((rows) => {
          setStudents(rows);
          setError('');
        })
        .catch((loadError: Error) => setError(loadError.message));
    load();
    return campusRepository.subscribe(load);
  }, []);

  const clearFilters = () => {
    searchModel.current?.clear(true, false);
    setQuery(EMPTY);
  };

  const rows = students.filter((student) => matches(student, query));
  const matchText = `${rows.length} ${rows.length === 1 ? 'match' : 'matches'} found`;

  return (
    <>
      <PageHeading
        title="Manage Students"
        description="Search by name, date of birth, or student ID. A name can be a first name, a surname, or both. Leave the fields blank to list every student."
        icon="users"
      />
      {error && <p className="mb-4 rounded-md border border-danger-border px-4 py-3 text-danger">{error}</p>}
      <section className={cx(panelClass, 'search-panel')}>
        <SurveyRenderer
          id="survey-search"
          schema={schema}
          data={{ name: query.name, surname: query.name, date_of_birth: query.dateOfBirth, student_number: query.studentNumber }}
          onSave={(data) => setQuery(queryFromSurvey(data))}
          onValueChanged={(data) => setQuery(queryFromSurvey(data))}
          prefill={demoPrefill.studentSearch}
          actions={[{ id: 'clear-search', title: 'Clear', css: 'campus-clear', action: clearFilters }]}
          configure={(model) => {
            model.textUpdateMode = 'onTyping';
            model.showCompleteButton = false;
            const nameQuestion = model.getQuestionByName('name') ?? model.getQuestionByName('surname');
            if (nameQuestion) {
              nameQuestion.title = 'Name';
              nameQuestion.placeholder = 'e.g. Emma Thompson';
            }
            if (!canCustomize) return;
            const toolbar = new ActionContainer();
            toolbar.setActionsAppearance({ mode: 'tertiary-surface', size: 'large', style: 'brand', showBorder: true });
            toolbar.cssClasses = { ...model.navigationBar.cssClasses, root: 'sd-action-bar search-header-actions' };
            toolbar.setItems([editFormAction('student-search', 'Customize Search Form', () => onOpenFormBuilder('student-search'))]);
            model.addLayoutElement({
              id: 'search-header-actions',
              container: 'header',
              component: 'sv-action-bar',
              data: toolbar,
            });
          }}
          onModelReady={(model) => (searchModel.current = model)}
        />
      </section>
      <h3 className="mt-7 mb-3.75 text-sm font-semibold text-muted-foreground" aria-live="polite">
        {matchText}
      </h3>
      {rows.length ? (
        <div className="flex flex-col gap-3.5">
          {rows.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className={emptyPanelClass}>
          <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon name="users" />
          </span>
          <h3 className="text-base font-semibold">No students matched your search</h3>
          <p className="mx-auto mt-2 max-w-140 text-sm text-muted-foreground">Try a different name, date of birth, or student ID.</p>
        </div>
      )}
    </>
  );
};
