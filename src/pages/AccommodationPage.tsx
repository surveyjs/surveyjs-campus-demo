import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SurveyDialog } from '../components/forms/SurveyDialog';
import { campusRepository } from '../repositories/campusRepository';
import { Residence } from '../types/campus';
import { AuthUser } from '../types/auth';
import { FormId } from '../types/forms';
import { canAllocateHousing, canManageCatalog } from '../ui/access';
import { Breadcrumbs, Button, emptyPanelClass, PageHeading, panelClass, PanelHeading, Pill, useDocumentTitle } from '../ui/components';
import { demoPrefill } from '../survey/demoPrefill';

interface AccommodationPageProps {
  user: AuthUser;
  onOpenFormBuilder: (formId: FormId, onReturn?: () => void) => void;
  showToast: (message: string) => void;
  ownStudentNumber?: string;
}

type DialogState = { kind: 'edit'; residence?: Residence } | { kind: 'allocate'; residence?: Residence };

export const AccommodationPage: React.FC<AccommodationPageProps> = ({ user, onOpenFormBuilder, showToast, ownStudentNumber }) => {
  const { residenceId } = useParams();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [detail, setDetail] = useState<Residence | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const openBuilder = (formId: FormId, next: DialogState) => {
    setDialog(null);
    onOpenFormBuilder(formId, () => setDialog(next));
  };
  const customize = canManageCatalog(user.role) ? openBuilder : undefined;
  useDocumentTitle(detail ? detail.name : 'Accommodation');

  useEffect(() => {
    const load = () =>
      campusRepository
        .residences()
        .then((rows) => {
          setResidences(rows);
          setError('');
        })
        .catch((loadError: Error) => setError(loadError.message))
        .finally(() => setLoading(false));
    load();
    return campusRepository.subscribe(load);
  }, []);

  useEffect(() => {
    if (!residenceId) {
      setDetail(null);
      return;
    }
    campusRepository
      .residence(residenceId)
      .then(setDetail)
      .catch((loadError: Error) => setError(loadError.message));
    return campusRepository.subscribe(() => {
      campusRepository.residence(residenceId).then(setDetail).catch(() => undefined);
    });
  }, [residenceId]);

  const residence = detail;

  if (residenceId && !loading && error && !residence) {
    return (
      <section className={emptyPanelClass}>
        <h2 className="text-base font-medium">Hall not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </section>
    );
  }

  return (
    <>
      {residence ? (
        <>
          <Breadcrumbs items={[{ label: 'Accommodation', path: '/accommodation' }, { label: residence.name }]} />
          <PageHeading title={residence.name} description={residence.category} icon="home" />
          <div className="mb-5 flex flex-wrap gap-2">
            {canAllocateHousing(user.role) && residence.occupancyStatus === 'Open' && (
              <Button variant="primary" onClick={() => setDialog({ kind: 'allocate', residence })}>
                Request a Hall Place
              </Button>
            )}
            {canManageCatalog(user.role) && (
              <Button icon="edit-2" onClick={() => setDialog({ kind: 'edit', residence })}>
                Edit Hall
              </Button>
            )}
          </div>
          <section className={`${panelClass} mb-4`}>
            <PanelHeading title="Hall Details" icon="home">
              <Pill>{residence.occupancyStatus}</Pill>
            </PanelHeading>
            <div className="grid gap-4 px-4 py-4 text-sm md:grid-cols-2">
              <p><span className="text-muted-foreground">Location · </span>{residence.location}</p>
              <p><span className="text-muted-foreground">Weekly rate · </span>£{residence.weeklyRate}</p>
              <p><span className="text-muted-foreground">Capacity · </span>{residence.capacity}</p>
              <p><span className="text-muted-foreground">Occupied · </span>{residence.occupied}</p>
              <p className="md:col-span-2">{residence.description}</p>
              {residence.baselineOccupancy > 0 && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  {residence.baselineOccupancy} earlier residents are included in the count and are not listed by name.
                </p>
              )}
            </div>
          </section>
          <section className={panelClass}>
            <PanelHeading title="Named Residents" icon="users" />
            <div className="px-4 py-4">
              {residence.residents.length ? (
                <ul className="flex flex-col gap-3">
                  {residence.residents.map((person) => (
                    <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <div>
                        <Link to={`/students/${person.studentId}`} className="font-medium text-foreground hover:underline">
                          {person.studentName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {person.studentNumber} · {person.roomType} · {person.contract}
                        </p>
                      </div>
                      <Pill tone="neutral">{person.status}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No named residents yet.</p>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <PageHeading
            title="Accommodation"
            description="Halls of residence, weekly rates, and student places."
            icon="home"
            action={
              canManageCatalog(user.role) ? (
                <Button variant="primary" icon="plus" onClick={() => setDialog({ kind: 'edit' })}>
                  Add Hall
                </Button>
              ) : undefined
            }
          />
          {error && <p className="mb-4 rounded-lg bg-danger/10 px-2.5 py-2 text-sm text-danger">{error}</p>}
          {loading ? (
            <p className="text-muted-foreground">Loading halls…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {residences.map((item) => (
                <Link key={item.id} to={`/accommodation/${item.id}`} className={`${panelClass} block px-4 py-4 hover:bg-muted`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.category}</p>
                      <h2 className="mt-1 text-base leading-snug font-medium">{item.name}</h2>
                    </div>
                    <Pill>{item.occupancyStatus}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.location} · £{item.weeklyRate} per week
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.occupied} of {item.capacity} places taken
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'edit' && (
        <SurveyDialog
          formId="accommodation-admin"
          heading={dialog.residence ? 'Edit Hall' : 'Add Hall'}
          data={
            dialog.residence
              ? {
                  name: dialog.residence.name,
                  category: dialog.residence.category,
                  description: dialog.residence.description,
                  location: dialog.residence.location,
                  weekly_rate: dialog.residence.weeklyRate,
                  capacity: dialog.residence.capacity,
                  status: dialog.residence.status === 'closed' ? 'Closed' : 'Open',
                }
              : { status: 'Open' }
          }
          prefill={dialog.residence ? undefined : demoPrefill.newHall}
          onClose={() => setDialog(null)}
          onCustomize={customize && (() => customize('accommodation-admin', dialog))}
          onSave={async (data) => {
            await campusRepository.saveResidence(data, dialog.residence?.id);
            showToast('Hall saved.');
          }}
        />
      )}
      {dialog?.kind === 'allocate' && (
        <SurveyDialog
          formId="accommodation-application"
          heading={dialog.residence ? `Request a place in ${dialog.residence.name}` : 'Request a Hall Place'}
          data={{ student_number: ownStudentNumber ?? '', residence_id: dialog.residence?.id ?? '' }}
          prefill={demoPrefill.hallApplication}
          onClose={() => setDialog(null)}
          onCustomize={customize && (() => customize('accommodation-application', dialog))}
          configure={(model) => {
            if (user.role === 'student') {
              const student = model.getQuestionByName('student_number');
              if (student) student.readOnly = true;
            }
            if (dialog.residence) {
              const hall = model.getQuestionByName('residence_id');
              if (hall) hall.readOnly = true;
            }
          }}
          onSave={async (data) => {
            const id = String(data.residence_id ?? dialog.residence?.id ?? '');
            if (!id) throw new Error('Select a hall.');
            await campusRepository.allocateResidence(id, data);
            showToast('Hall place saved.');
          }}
        />
      )}
    </>
  );
};
