import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SurveyDialog } from '../components/forms/SurveyDialog';
import { campusRepository } from '../repositories/campusRepository';
import { CampusEvent } from '../types/campus';
import { AuthUser } from '../types/auth';
import { FormId } from '../types/forms';
import { canManageCatalog, canRegisterEvents } from '../ui/access';
import { Breadcrumbs, Button, emptyPanelClass, PageHeading, panelClass, PanelHeading, Pill, useDocumentTitle } from '../ui/components';
import { formatDate } from '../ui/format';
import { demoPrefill } from '../survey/demoPrefill';

interface EventsPageProps {
  user: AuthUser;
  onOpenFormBuilder: (formId: FormId, onReturn?: () => void) => void;
  showToast: (message: string) => void;
  ownStudentNumber?: string;
}

type DialogState = { kind: 'edit'; event?: CampusEvent } | { kind: 'register'; event: CampusEvent };

export const EventsPage: React.FC<EventsPageProps> = ({ user, onOpenFormBuilder, showToast, ownStudentNumber }) => {
  const { eventId } = useParams();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [detail, setDetail] = useState<CampusEvent | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const openBuilder = (formId: FormId, next: DialogState) => {
    setDialog(null);
    onOpenFormBuilder(formId, () => setDialog(next));
  };
  const customize = canManageCatalog(user.role) ? openBuilder : undefined;
  useDocumentTitle(detail ? detail.name : 'Events');

  useEffect(() => {
    const load = () =>
      campusRepository
        .events()
        .then((rows) => {
          setEvents(rows);
          setError('');
        })
        .catch((loadError: Error) => setError(loadError.message))
        .finally(() => setLoading(false));
    load();
    return campusRepository.subscribe(load);
  }, []);

  useEffect(() => {
    if (!eventId) {
      setDetail(null);
      return;
    }
    campusRepository
      .event(eventId)
      .then(setDetail)
      .catch((loadError: Error) => setError(loadError.message));
    return campusRepository.subscribe(() => {
      campusRepository.event(eventId).then(setDetail).catch(() => undefined);
    });
  }, [eventId]);

  const event = detail;

  const cancelEvent = (current: CampusEvent) => {
    campusRepository
      .saveEvent(
        {
          name: current.name,
          category: current.category,
          description: current.description,
          event_date: current.eventDate,
          location: current.location,
          capacity: current.capacity,
          status: 'Cancelled',
        },
        current.id,
      )
      .then(() => showToast('Event cancelled.'))
      .catch((cancelError: Error) => setError(cancelError.message));
  };

  if (eventId && !loading && error && !event) {
    return (
      <section className={emptyPanelClass}>
        <h2 className="text-base font-semibold">Event not found</h2>
        <Link to="/events" className="mt-3 inline-flex text-primary">
          Back to events
        </Link>
      </section>
    );
  }

  return (
    <>
      {event ? (
        <>
          <Breadcrumbs items={[{ label: 'Events', path: '/events' }, { label: event.name }]} />
          <PageHeading title={event.name} description={event.category} icon="calendar" />
          <div className="mb-5 flex flex-wrap gap-2">
            {canRegisterEvents(user.role) && event.registrationStatus === 'Open' && (
              <Button variant="primary" onClick={() => setDialog({ kind: 'register', event })}>
                Register Student
              </Button>
            )}
            {canManageCatalog(user.role) && (
              <Button icon="edit-2" onClick={() => setDialog({ kind: 'edit', event })}>
                Edit Event
              </Button>
            )}
            {canManageCatalog(user.role) && event.status === 'open' && (
              <Button variant="danger" onClick={() => cancelEvent(event)}>
                Cancel Event
              </Button>
            )}
          </div>
          <section className={`${panelClass} mb-4`}>
            <PanelHeading title="Event Details" icon="map-pin">
              <Pill>{event.registrationStatus}</Pill>
            </PanelHeading>
            <div className="grid gap-3 px-5 py-5 text-sm md:grid-cols-2 md:px-6">
              <p><span className="text-muted-foreground">When · </span>{formatDate(event.eventDate)}</p>
              <p><span className="text-muted-foreground">Where · </span>{event.location}</p>
              <p><span className="text-muted-foreground">Capacity · </span>{event.capacity}</p>
              <p><span className="text-muted-foreground">Registered · </span>{event.registeredCount}</p>
              <p className="md:col-span-2">{event.description}</p>
              {event.baselineRegistrations > 0 && (
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  {event.baselineRegistrations} earlier registrations are included in the count and are not listed by name.
                </p>
              )}
            </div>
          </section>
          <section className={panelClass}>
            <PanelHeading title="Registered Participants" icon="users" />
            <div className="px-5 py-5 md:px-6">
              {event.participants.length ? (
                <ul className="flex flex-col gap-2">
                  {event.participants.map((person) => (
                    <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-3">
                      <div>
                        <p className="font-semibold">{person.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {person.studentNumber} · {person.areaOfInterest || 'No area recorded'}
                        </p>
                      </div>
                      <Pill tone="neutral">{person.status}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No named participants yet.</p>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <PageHeading
            title="Events"
            description="Campus events, capacity, and student registrations."
            icon="calendar"
            action={
              canManageCatalog(user.role) ? (
                <Button variant="primary" icon="plus" onClick={() => setDialog({ kind: 'edit' })}>
                  Create Event
                </Button>
              ) : undefined
            }
          />
          {error && <p className="mb-4 text-danger">{error}</p>}
          {loading ? (
            <p className="text-muted-foreground">Loading events…</p>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2">
              {events.map((item) => (
                <Link key={item.id} to={`/events/${item.id}`} className={`${panelClass} block px-5 py-4.5 hover:bg-card-hover md:px-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary">{item.category}</p>
                      <h2 className="mt-1 text-base font-semibold">{item.name}</h2>
                    </div>
                    <Pill>{item.registrationStatus}</Pill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.eventDate)} · {item.location}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.registeredCount} of {item.capacity} registered
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'edit' && (
        <SurveyDialog
          formId="event-admin"
          heading={dialog.event ? 'Edit Event' : 'Create Event'}
          data={
            dialog.event
              ? {
                  name: dialog.event.name,
                  category: dialog.event.category,
                  description: dialog.event.description,
                  event_date: dialog.event.eventDate,
                  location: dialog.event.location,
                  capacity: dialog.event.capacity,
                  status: dialog.event.status === 'cancelled' ? 'Cancelled' : 'Open',
                }
              : { status: 'Open' }
          }
          prefill={dialog.event ? undefined : demoPrefill.newEvent}
          onClose={() => setDialog(null)}
          onCustomize={customize && (() => customize('event-admin', dialog))}
          onSave={async (data) => {
            await campusRepository.saveEvent(data, dialog.event?.id);
            showToast('Event saved.');
          }}
        />
      )}
      {dialog?.kind === 'register' && (
        <SurveyDialog
          formId="event-registration"
          heading={`Register for ${dialog.event.name}`}
          data={{ student_number: ownStudentNumber ?? '' }}
          prefill={demoPrefill.eventRegistration}
          onClose={() => setDialog(null)}
          onCustomize={customize && (() => customize('event-registration', dialog))}
          configure={(model) => {
            if (user.role === 'student') {
              const question = model.getQuestionByName('student_number');
              if (question) question.readOnly = true;
            }
          }}
          onSave={async (data) => {
            await campusRepository.registerForEvent(dialog.event.id, data);
            showToast('Event registration saved.');
          }}
        />
      )}
    </>
  );
};
