import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SurveyNavigationAction } from '../survey/SurveyRenderer';
import { formRepository } from '../repositories/formRepository';
import { FormId } from '../types/forms';
import { FeatherIconName } from './featherIcons';
import { Icon } from './Icon';

/** Joins the truthy class names. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

// `panel` is a hook for demoTools.mark(), which moves the SurveyJS outline onto the card.
export const panelClass = 'panel overflow-hidden rounded-card border border-border bg-card';
export const panelBodyClass = 'px-5 py-5 md:px-6';
export const mutedClass = 'text-muted-foreground';
export const emptyPanelClass = cx(panelClass, 'px-5 py-8 text-center sm:px-6 sm:py-10');

export const PageHeading: React.FC<{
  title: string;
  description?: string;
  icon: FeatherIconName;
  /** A page-level action shown beside the heading on wide screens and below it otherwise. */
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => {
  const heading = (
    <header className={cx('flex items-start gap-4', action ? 'mb-4 xl:mb-8' : 'mb-6 md:mb-8')}>
      <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-soft text-primary md:size-12">
        <Icon name={icon} className="size-5 md:size-6" />
      </span>
      <div>
        <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
    </header>
  );
  if (!action) return heading;
  return (
    <div className="mb-7 flex flex-col xl:mb-0 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
      {heading}
      {action}
    </div>
  );
};

/** Card header row: a title (optionally with an icon and description) and trailing content. */
export const PanelHeading: React.FC<{
  title: string;
  icon?: FeatherIconName;
  description?: string;
  children?: React.ReactNode;
}> = ({ title, icon, description, children }) => {
  const heading = (
    <h2 className="flex items-center gap-2 text-base leading-tight font-semibold tracking-tight sm:text-lg">
      {icon && <Icon name={icon} className="size-4 text-primary sm:size-5" />}
      {title}
    </h2>
  );
  return (
    <div className="mx-5 flex min-h-18 flex-wrap items-center justify-between gap-2 border-b border-border py-5 md:mx-6 xl:gap-4">
      {description ? (
        <div>
          {heading}
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      ) : (
        heading
      )}
      {children}
    </div>
  );
};

export interface Crumb {
  label: string;
  path?: string;
}

// Breadcrumbs express page hierarchy; top-level tabs do not repeat it.
export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <nav className="mb-4 text-xs" aria-label="Breadcrumb">
    <ol role="list" className="flex flex-wrap items-center gap-x-2">
      {items.map((item, index) => (
        <li key={item.label} className="flex max-w-full min-w-0 items-center gap-2">
          {index > 0 && <Icon name="chevron-right" className="size-4 text-subtle-foreground" />}
          {item.path ? (
            <Link
              to={item.path}
              className="inline-flex min-h-8 items-center py-1 text-primary underline underline-offset-4 wrap-anywhere hover:text-primary-hover"
            >
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="inline-flex min-h-8 items-center py-1 text-muted-foreground wrap-anywhere">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export type ButtonVariant = 'outline' | 'primary' | 'danger';
export type ButtonSize = 'md' | 'sm' | 'xs' | 'icon';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  outline: 'border-input bg-card text-primary hover:border-border-hover hover:bg-accent',
  primary: 'border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover',
  danger: 'border-danger-border bg-card text-danger hover:bg-accent',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 gap-2 px-4 py-2 text-sm [&_svg]:size-4',
  sm: 'min-h-10 gap-2 px-3 py-2 text-xs [&_svg]:size-4',
  xs: 'min-h-7 gap-1 rounded px-2 py-1 text-xs',
  icon: 'size-10 [&_svg]:size-5',
};

/** Shared by <Button> and router links styled as buttons. */
export const buttonClass = (variant: ButtonVariant = 'outline', size: ButtonSize = 'md', className?: string) =>
  cx(
    'inline-flex items-center justify-center rounded-md border font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: FeatherIconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button: React.FC<ButtonProps> = ({ icon, variant, size, className, children, ...rest }) => (
  <button type="button" className={buttonClass(variant, size, className)} {...rest}>
    {icon && <Icon name={icon} />}
    {children}
  </button>
);

export const iconButtonClass =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-primary-soft hover:text-primary';

export const Pill: React.FC<{ tone?: 'brand' | 'neutral'; children: React.ReactNode }> = ({ tone = 'brand', children }) => (
  <span
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
      tone === 'brand' ? 'bg-tag text-primary' : 'bg-muted text-muted-foreground',
    )}
  >
    {children}
  </span>
);

/** Footer action that opens a form in the builder, aligned right of the form's own buttons. */
export function editFormAction(formId: FormId, label: string, open: () => void): SurveyNavigationAction {
  return {
    id: 'edit-form-' + formId,
    title: label,
    css: 'campus-edit-form',
    iconName: 'campus-feather-settings',
    iconSize: 16,
    showTitle: true,
    disableShrink: true,
    action: open,
  };
}

/** Current schema for a form, refreshed when the builder saves or resets it. */
export function useFormSchema(formId: FormId): object {
  const [schema, setSchema] = useState(() => formRepository.getForm(formId));
  useEffect(
    () =>
      formRepository.subscribe((changedId) => {
        if (changedId === formId) setSchema(formRepository.getForm(formId));
      }),
    [formId],
  );
  return schema;
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = 'Acme Campus · ' + title;
  }, [title]);
}

export const NotFound: React.FC<{ backPath: string; backLabel: string }> = ({ backPath, backLabel }) => {
  useDocumentTitle('Page not found');
  return (
    <>
      <PageHeading title="Page not found" description="This page is not available in the demo." icon="info" />
      <section className={emptyPanelClass}>
        <Link to={backPath} className={buttonClass('primary')}>
          {backLabel}
        </Link>
      </section>
    </>
  );
};
