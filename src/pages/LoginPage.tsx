import React, { useMemo, useRef } from 'react';
import { SurveyError } from 'survey-core';
import { authRepository } from '../repositories/authRepository';
import { demoPrefill } from '../survey/demoPrefill';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { Session } from '../types/auth';
import { PageHeading, panelClass, useDocumentTitle, useFormSchema } from '../ui/components';

interface LoginPageProps {
  onLogin: (session: Session, remember: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  useDocumentTitle('Sign In');
  const storedSchema = useFormSchema('login');
  const pending = useRef(false);
  const schema = useMemo(() => {
    const copy = structuredClone(storedSchema) as { pages?: { elements?: Record<string, unknown>[] }[] };
    copy.pages?.forEach((page) =>
      page.elements?.forEach((element) => {
        if (element.name === 'remember_me') element.defaultValue = false;
      }),
    );
    return copy;
  }, [storedSchema]);

  return (
    <>
      <PageHeading
        title="Campus Sign In"
        description="Choose a demo account to open the campus workspace. Every password is demo1234."
        icon="log-in"
      />
      <section className={panelClass}>
        <SurveyRenderer
          id="login-form"
          schema={schema}
          hideTitle
          prefill={demoPrefill.login}
          onSave={(data, model) => {
            if (pending.current) return;
            pending.current = true;
            authRepository
              .login(String(data.username ?? ''), String(data.password ?? ''))
              .then((user) => onLogin(user, !!data.remember_me))
              .catch(() => model.getQuestionByName('password')?.addError(new SurveyError('Invalid username or password. Please try again.')))
              .finally(() => {
                pending.current = false;
              });
          }}
        />
      </section>
    </>
  );
};
