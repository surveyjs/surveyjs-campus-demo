import React, { useEffect, useMemo, useRef } from 'react';
import { IAction, Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import 'survey-core/themes/adapters/shadcn-base-nova.css';
import 'survey-core/themes/adapters/icons/lucide';
import { demoTools } from '../theme/demoTools';

export type SurveyNavigationAction = Partial<IAction> & { id: string };

export interface SurveyRendererProps {
  /** Host element id; also prefixes SurveyJS element ids and selects host-specific theme tokens. */
  id: string;
  schema: object;
  /** Initial answers; applied when the model is created. */
  data?: Record<string, unknown>;
  /** Called from onCompleting after validation passes; the form stays live (no completion page). */
  onSave?: (data: Record<string, any>, model: Model) => void;
  onValueChanged?: (data: Record<string, any>, model: Model) => void;
  /** Extra footer navigation items, rendered after the Complete button. */
  actions?: SurveyNavigationAction[];
  /** Sample answers for the Prefill Demo Data button. Read-only questions keep their current values. */
  prefill?: Record<string, unknown>;
  readOnly?: boolean;
  hideTitle?: boolean;
  showNavigation?: boolean;
  /** Final model customization before the first render. */
  configure?: (model: Model) => void;
  onModelReady?: (model: Model) => void;
}

/** Renders a SurveyJS form. Colors come from the shadcn adapter and the host tokens. */
export const SurveyRenderer: React.FC<SurveyRendererProps> = ({
  id,
  schema,
  data,
  onSave,
  onValueChanged,
  actions = [],
  prefill,
  readOnly = false,
  hideTitle = false,
  showNavigation = true,
  configure,
  onModelReady,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  // Handlers are read through refs so a re-render never rebuilds the model.
  const handlers = useRef({ onSave, onValueChanged, actions });
  handlers.current = { onSave, onValueChanged, actions };

  const model = useMemo(() => {
    const m = new Model({
      ...schema,
      questionErrorLocation: 'bottom',
      showQuestionNumbers: 'off',
      showCompletePage: false,
      widthMode: 'responsive',
      showTitle: !hideTitle,
      showNavigationButtons: showNavigation,
      mode: readOnly ? 'display' : 'edit',
    });
    m.elementIdPrefix = id + '-';
    if (data) m.data = { ...m.data, ...structuredClone(data) };
    m.onCompleting.add((sender, options) => {
      options.allow = false;
      handlers.current.onSave?.(structuredClone(sender.data), sender);
    });
    m.onValueChanged.add((sender) => handlers.current.onValueChanged?.(sender.data, sender));
    if (prefill) {
      const sample = prefill;
      m.addNavigationItem({
        id: 'prefill-demo-data',
        title: 'Prefill Demo Data',
        visibleIndex: 40,
        showTitle: true,
        disableShrink: true,
        action: () => {
          const active = document.activeElement;
          if (active instanceof HTMLElement) active.blur();
          const next: Record<string, unknown> = { ...sample };
          m.getAllQuestions().forEach((question) => {
            if (question.readOnly) delete next[question.name];
          });
          Object.entries(next).forEach(([name, value]) => m.setValue(name, value));
          m.clearErrors();
        },
      });
    }
    actions.forEach((action, index) =>
      m.addNavigationItem({
        visibleIndex: 60 + index * 10,
        ...action,
        action: () => handlers.current.actions.find((item) => item.id === action.id)?.action?.(),
      }),
    );
    configure?.(m);
    m.getAllQuestions().forEach((question) => {
      if (question.getType() === 'boolean') question.displayMode = 'switch';
    });
    return m;
    // The model is rebuilt only for a new schema or display mode, like the designer's render().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, schema, readOnly, hideTitle, showNavigation, prefill]);

  useEffect(() => {
    onModelReady?.(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    if (hostRef.current) demoTools.mark(hostRef.current);
  }, []);

  return (
    <div id={id} ref={hostRef} className="native-survey">
      <Survey model={model} />
    </div>
  );
};
