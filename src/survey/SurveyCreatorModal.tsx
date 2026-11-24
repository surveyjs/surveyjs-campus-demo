import React, { useEffect, useMemo, useRef } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-creator-core/survey-creator-core.min.css';
import { Dialog } from '../components/common/Dialog';
import { formRepository } from '../repositories/formRepository';
import { FormId } from '../types/forms';
import { applyClinicCreatorTheme, setActiveCreator } from '../theme/campusTheme';
import { demoTools } from '../theme/demoTools';
import { Button, iconButtonClass } from '../ui/components';
import { Icon } from '../ui/Icon';

interface SurveyCreatorModalProps {
  formId: FormId;
  onClose: () => void;
  onApplied: (formId: FormId) => void;
}

export const SurveyCreatorModal: React.FC<SurveyCreatorModalProps> = ({ formId, onClose, onApplied }) => {
  const metadata = formRepository.getMetadata(formId);
  const title = metadata.title || formId;
  const containerRef = useRef<HTMLDivElement>(null);
  const licensed = Boolean(import.meta.env.SURVEYJS_KEY?.trim());

  const creator = useMemo(() => {
    const instance = new SurveyCreator({ showLogicTab: true, showJSONEditorTab: true, autoSaveEnabled: false });
    instance.JSON = formRepository.getForm(formId);
    applyClinicCreatorTheme(instance);
    return instance;
  }, [formId]);

  useEffect(() => {
    setActiveCreator(creator);
    if (containerRef.current) demoTools.mark(containerRef.current, 'SurveyJS Creator');
    return () => setActiveCreator(null);
  }, [creator]);

  const saveAndApply = async () => {
    try {
      await formRepository.saveForm(formId, creator.JSON);
      onApplied(formId);
    } catch (error) {
      console.error('Failed to save form schema:', error);
    }
  };

  return (
    <Dialog
      label={`Form Builder: ${title}`}
      className="inset-0 m-0 h-dvh max-h-none w-screen max-w-none flex-col overflow-hidden open:flex"
      onClose={onClose}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base leading-none font-medium">Form Builder: {title}</h2>
          <p className="mt-2 text-sm text-muted-foreground md:max-lg:max-w-120">
            This saves the form definition only. It does not create a student, registration, or other record.
            {licensed ? '' : ' Survey Creator is a commercial product and shows a license banner until SURVEYJS_KEY is set.'}
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
          <Button onClick={() => (creator.JSON = structuredClone(metadata.defaultSchema))}>Reset to Default</Button>
          <Button variant="primary" onClick={() => void saveAndApply()}>
            Save &amp; Apply Form
          </Button>
          <button type="button" className={`${iconButtonClass} max-md:ml-auto`} aria-label="Close Form Builder" onClick={onClose}>
            <Icon name="x" className="size-4" />
          </button>
        </div>
      </div>
      <div id="survey-creator" ref={containerRef} className="min-h-0 flex-1">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Dialog>
  );
};
