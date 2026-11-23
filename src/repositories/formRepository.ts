import { FORM_CATALOG } from '../survey/catalog';
import { FormId, FormVersionInfo } from '../types/forms';
import { api } from './api';

const defaults = Object.fromEntries(FORM_CATALOG.map((form) => [form.id, form])) as Record<
  FormId,
  (typeof FORM_CATALOG)[number]
>;

type Listener = (formId: FormId) => void;
const listeners = new Set<Listener>();
const active = new Map<FormId, FormVersionInfo>();

export const formRepository = {
  async init(): Promise<void> {
    try {
      const forms = await api<FormVersionInfo[]>('/forms');
      active.clear();
      for (const form of forms) active.set(form.id, form);
    } catch (error) {
      console.error('Failed to load form schemas:', error);
    }
  },

  getForm(formId: FormId): object {
    return active.get(formId)?.schema ?? defaults[formId].schema;
  },

  getVersionId(formId: FormId): string | undefined {
    return active.get(formId)?.versionId || undefined;
  },

  getMetadata(formId: FormId) {
    const current = active.get(formId);
    const fallback = defaults[formId];
    return {
      id: formId,
      title: current?.name ?? fallback.name,
      description: current?.description ?? fallback.description,
      defaultSchema: fallback.schema,
    };
  },

  async saveForm(formId: FormId, schema: object): Promise<void> {
    const saved = await api<{ id: string; versionNumber: number; schema: object }>(`/forms/${formId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ schema }),
    });
    const previous = active.get(formId);
    const fallback = defaults[formId];
    active.set(formId, {
      id: formId,
      name: previous?.name ?? fallback.name,
      category: previous?.category ?? fallback.category,
      description: previous?.description ?? fallback.description,
      status: 'active',
      versionId: saved.id,
      versionNumber: saved.versionNumber,
      schema: saved.schema,
    });
    listeners.forEach((listener) => listener(formId));
  },

  async resetForm(formId: FormId): Promise<object> {
    const schema = structuredClone(defaults[formId].schema);
    await formRepository.saveForm(formId, schema);
    return schema;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
