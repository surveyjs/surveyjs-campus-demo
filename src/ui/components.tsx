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
export const panelClass = 'panel overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10';
export const panelBodyClass = 'px-4 py-4';
export const mutedClass = 'text-muted-foreground';
export const emptyPanelClass = cx(panelClass, 'px-4 py-8 text-center');

export const PageHeading: React.FC<{
  title: string;
  description?: string;
  icon: FeatherIconName;
  /** A page-level action shown beside the heading on wide screens and below it otherwise. */
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => {
  const heading = (
    <header className={cx('flex items-start gap-3', action ? 'mb-4 xl:mb-0' : 'mb-6')}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon name={icon} className="size-4" />
      </span>
      <div>
        <h1 className="text-2xl leading-none font-medium tracking-tight">{title}</h1>
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
    <h2 className="flex items-center gap-2 text-base leading-snug font-medium">
      {icon && <Icon name={icon} className="size-4 text-foreground" />}
      {title}
    </h2>
  );
  return (
    <div className="mx-4 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border py-4">
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
  <nav className="mb-4" aria-label="Breadcrumb">
    <ol role="list" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={item.label} className="inline-flex max-w-full min-w-0 items-center gap-1.5">
          {index > 0 && <Icon name="chevron-right" className="size-3.5" />}
          {item.path ? (
            <Link to={item.path} className="wrap-anywhere transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-normal text-foreground wrap-anywhere">
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
  outline: 'border border-outline-border bg-outline-bg text-foreground hover:bg-outline-hover',
  primary: 'border border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  danger: 'border border-transparent bg-danger/10 text-danger hover:bg-danger/20',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'h-8 gap-1.5 px-2.5',
  sm: 'h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]',
  xs: 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs',
  icon: 'size-8',
};

/** Shared by <Button> and router links styled as buttons. */
export const buttonClass = (variant: ButtonVariant = 'outline', size: ButtonSize = 'md', className?: string) =>
  cx(
    'inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: FeatherIconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BUTTON_ICON: Record<ButtonSize, string> = { md: 'size-4', sm: 'size-3.5', xs: 'size-3', icon: 'size-4' };

export const Button: React.FC<ButtonProps> = ({ icon, variant, size = 'md', className, children, ...rest }) => (
  <button type="button" className={buttonClass(variant, size, className)} {...rest}>
    {icon && <Icon name={icon} className={BUTTON_ICON[size]} />}
    {children}
  </button>
);

export const iconButtonClass =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted [&_svg]:size-4';

export const Pill: React.FC<{ tone?: 'brand' | 'neutral'; children: React.ReactNode }> = ({ tone = 'brand', children }) => (
  <span
    className={cx(
      'inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      tone === 'brand' ? 'border-transparent bg-secondary text-secondary-foreground' : 'border-border text-foreground',
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
