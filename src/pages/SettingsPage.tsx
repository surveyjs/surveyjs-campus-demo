import React, { useState } from 'react';
import { Modal } from '../components/common/Dialog';
import { authRepository } from '../repositories/authRepository';
import { campusRepository } from '../repositories/campusRepository';
import { AuthUser } from '../types/auth';
import { Button, PageHeading, panelBodyClass, panelClass, PanelHeading, useDocumentTitle } from '../ui/components';

const STORAGE_KEY = 'campus-auth-session';

interface SettingsPageProps {
  currentUser: AuthUser;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  useDocumentTitle('Settings');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const resetDemoData = async () => {
    setPending(true);
    setError('');
    const remember = Boolean(window.localStorage.getItem(STORAGE_KEY));
    try {
      const next = await campusRepository.resetDemo();
      authRepository.store({ ...currentUser, ...next }, remember);
      window.location.assign('/settings');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The demo could not be restored.');
      setPending(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Settings"
        description="Restore the local demo to its starting records and form definitions."
        icon="settings"
      />
      <section className={`${panelClass} max-w-162`}>
        <PanelHeading title="Demo State & Data Persistence" icon="database" />
        <div className={panelBodyClass}>
          <p className="text-sm text-muted-foreground">
            Student records, course registrations, events, hall places, and customized forms are saved in the local SQLite database.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmingReset(true)}>
            Reset All Demo Data to Default
          </Button>
        </div>
      </section>
      {confirmingReset && (
        <Modal
          heading="Reset All Demo Data to Default"
          description="Restore the local demo to its starting state."
          onClose={() => {
            if (!pending) setConfirmingReset(false);
          }}
          footer={
            <>
              <Button disabled={pending} onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={pending} onClick={() => void resetDemoData()}>
                Reset to Default
              </Button>
            </>
          }
        >
          <p>This restores students, registrations, events, hall places, and form definitions in the local database.</p>
          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
};
