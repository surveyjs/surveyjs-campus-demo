import React, { useLayoutEffect, useRef, useState } from 'react';
import { demoTools } from '../../theme/demoTools';
import { cx, iconButtonClass } from '../../ui/components';
import { Icon } from '../../ui/Icon';

interface DialogProps {
  label: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Native modal <dialog>: opens on mount, closes on unmount, and returns focus to its trigger. */
export const Dialog: React.FC<DialogProps> = ({ label, className = '', onClose, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [lastFocus] = useState(() => document.activeElement as HTMLElement | null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    demoTools.attach(dialog);
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      // Return the dock to the page before React removes the dialog.
      demoTools.attach();
      dialog.close();
      if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    };
  }, [lastFocus]);

  return (
    <dialog
      ref={ref}
      className={cx('overscroll-contain bg-popover text-sm text-popover-foreground backdrop:bg-black/10 backdrop:backdrop-blur-xs', className)}
      aria-label={label}
    >
      {children}
    </dialog>
  );
};

interface ModalProps {
  heading: string;
  description?: string;
  /** A wide dialog whose body is a SurveyJS form with its own padding. */
  form?: boolean;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/** Dialog with the standard heading, close button, body and optional footer. */
export const Modal: React.FC<ModalProps> = ({ heading, description, form = false, footer, onClose, children }) => (
  <Dialog
    label={heading}
    className={cx(
      'top-0 right-0 bottom-(--campus-dock-offset) left-0 m-auto h-fit max-h-[calc(100dvh-var(--campus-dock-offset)-4rem)] rounded-xl ring-1 ring-foreground/10',
      form ? 'w-190 max-w-[calc(100vw-24px)] md:max-w-[calc(100vw-32px)]' : 'w-130 max-w-[calc(100vw-32px)]',
    )}
    onClose={onClose}
  >
    <div className={cx('flex items-start justify-between gap-4 p-4', form && 'items-center')}>
      <div className="min-w-0">
        <h2 className="text-base leading-none font-medium wrap-anywhere">{heading}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      <button type="button" className={iconButtonClass} aria-label="Close dialog" onClick={onClose}>
        <Icon name="x" className="size-4" />
      </button>
    </div>
    <div className={form ? '' : 'px-4 pb-4 text-sm text-muted-foreground'}>{children}</div>
    {footer && <div className="flex justify-end gap-2 border-t bg-muted/50 p-4">{footer}</div>}
  </Dialog>
);
