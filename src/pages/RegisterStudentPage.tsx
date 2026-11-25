import React, { useRef } from 'react';
import { Model, SurveyError } from 'survey-core';
import { useNavigate } from 'react-router-dom';
import { campusRepository } from '../repositories/campusRepository';
import { demoPrefill } from '../survey/demoPrefill';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { FormId } from '../types/forms';
import { editFormAction, PageHeading, panelClass, useDocumentTitle, useFormSchema } from '../ui/components';

interface RegisterStudentPageProps {
  onOpenFormBuilder: (formId: FormId) => void;
  showToast: (message: string) => void;
}

export const RegisterStudentPage: React.FC<RegisterStudentPageProps> = ({ onOpenFormBuilder, showToast }) => {
  useDocumentTitle('Register Student');
  const schema = useFormSchema('student-registration');
  const navigate = useNavigate();
  const pending = useRef(false);

  return (
    <>
      <PageHeading
        title="Register Student"
        description="Save a new student record. Required fields and the student ID are checked before the record is stored."
        icon="user-plus"
      />
      <section className={panelClass}>
        <SurveyRenderer
          id="student-registration"
          schema={schema}
          hideTitle
          prefill={demoPrefill.studentRegistration}
          actions={[editFormAction('student-registration', 'Customize Form', () => onOpenFormBuilder('student-registration'))]}
          onSave={(data, model) => {
            if (pending.current) return;
            pending.current = true;
            campusRepository
              .registerStudent(data)
              .then((student) => {
                showToast('Student registered.');
                navigate(`/students/${student.id}`);
              })
              .catch((error: Error) => {
                const question = model.getQuestionByName('student_number') ?? model.getAllQuestions()[0];
                question?.addError(new SurveyError(error.message));
              })
              .finally(() => {
                pending.current = false;
              });
          }}
        />
      </section>
    </>
  );
};

export function showSurveyError(model: Model, message: string) {
  const question = model.getAllQuestions()[0];
  question?.addError(new SurveyError(message));
}
