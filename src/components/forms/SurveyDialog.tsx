import React, { useRef } from 'react';
import { Model, SurveyError } from 'survey-core';
import { Modal } from '../common/Dialog';
import { formRepository } from '../../repositories/formRepository';
import { SurveyRenderer } from '../../survey/SurveyRenderer';
import { FormId } from '../../types/forms';
import { editFormAction, useFormSchema } from '../../ui/components';

interface SurveyDialogProps {
  formId: FormId;
  heading: string;
  description?: string;
  data?: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCustomize?: () => void;
  customizeLabel?: string;
  prefill?: Record<string, unknown>;
  configure?: (model: Model) => void;
}

function showError(model: Model, message: string) {
  const question = model.getAllQuestions().find((item) => item.isVisible) ?? model.getAllQuestions()[0];
  question?.addError(new SurveyError(message));
}

export const SurveyDialog: React.FC<SurveyDialogProps> = ({
  formId,
  heading,
  description,
  data,
  onClose,
  onSave,
  onCustomize,
  customizeLabel = 'Customize Form',
  prefill,
  configure,
}) => {
  const schema = useFormSchema(formId);
  const pending = useRef(false);
  const actions = onCustomize ? [editFormAction(formId, customizeLabel, onCustomize)] : [];

  return (
    <Modal heading={heading} description={description} form onClose={onClose}>
      <SurveyRenderer
        id={`${formId}-dialog`}
        schema={schema}
        data={data}
        actions={actions}
        prefill={prefill}
        configure={configure}
        onSave={(answers, model) => {
          if (pending.current) return;
          pending.current = true;
          onSave(answers)
            .then(onClose)
            .catch((error: Error) => showError(model, error.message))
            .finally(() => {
              pending.current = false;
            });
          // The version id is read when the repository builds the request.
          void formRepository.getVersionId(formId);
        }}
      />
    </Modal>
  );
};
