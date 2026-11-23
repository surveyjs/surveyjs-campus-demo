import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Toast } from './components/common/Toast';
import { CoursesPage } from './pages/CoursesPage';
import { EventsPage } from './pages/EventsPage';
import { LoginPage } from './pages/LoginPage';
import { ManageStudentsPage } from './pages/ManageStudentsPage';
import { RegisterStudentPage } from './pages/RegisterStudentPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { authRepository } from './repositories/authRepository';
import { onUnauthorized } from './repositories/api';
import { campusRepository } from './repositories/campusRepository';
import { SurveyCreatorModal } from './survey/SurveyCreatorModal';
import { AuthUser } from './types/auth';
import { FormId } from './types/forms';
import { homePath } from './ui/access';

type OpenFormBuilder = (formId: FormId, onReturn?: () => void) => void;

function StudentRoute(props: { user: AuthUser; onOpenFormBuilder: OpenFormBuilder; showToast: (message: string) => void }) {
  const { studentId } = useParams();
  if (props.user.role === 'student' && studentId !== props.user.studentId) return <Navigate to="/portal" replace />;
  return <StudentProfilePage key={studentId} studentId={studentId!} {...props} />;
}

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authRepository.current());
  const [ownStudentNumber, setOwnStudentNumber] = useState('');
  const [builderFormId, setBuilderFormId] = useState<FormId | null>(null);
  const builderReturnRef = useRef<(() => void) | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3300);
  };

  useEffect(() => onUnauthorized(() => setCurrentUser(null)), []);

  useEffect(() => {
    if (currentUser?.role !== 'student' || !currentUser.studentId) return;
    campusRepository
      .student(currentUser.studentId)
      .then((student) => setOwnStudentNumber(student.studentNumber))
      .catch(() => undefined);
  }, [currentUser]);

  const openFormBuilder: OpenFormBuilder = (formId, onReturn) => {
    builderReturnRef.current = onReturn ?? null;
    setBuilderFormId(formId);
  };

  const handleLogout = () => {
    void authRepository.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  let routes: React.ReactNode;
  if (!currentUser) {
    routes = (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={(session, remember) => {
                authRepository.store(session, remember);
                setCurrentUser(session);
                navigate(homePath(session.role), { replace: true });
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  } else {
    const home = homePath(currentUser.role);
    routes = (
      <Routes>
        {currentUser.role !== 'student' && (
          <Route path="/manage" element={<ManageStudentsPage onOpenFormBuilder={openFormBuilder} />} />
        )}
        {currentUser.role === 'administrator' && (
          <Route
            path="/register"
            element={<RegisterStudentPage onOpenFormBuilder={openFormBuilder} showToast={showToast} />}
          />
        )}
        <Route path="/students/:studentId" element={<StudentRoute user={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} />} />
        {currentUser.role === 'student' && currentUser.studentId && (
          <Route
            path="/portal"
            element={
              <StudentProfilePage
                studentId={currentUser.studentId}
                user={currentUser}
                onOpenFormBuilder={openFormBuilder}
                showToast={showToast}
                portal
              />
            }
          />
        )}
        <Route
          path="/courses"
          element={<CoursesPage user={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} ownStudentNumber={ownStudentNumber} />}
        />
        <Route
          path="/courses/:courseId"
          element={<CoursesPage user={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} ownStudentNumber={ownStudentNumber} />}
        />
        <Route
          path="/events"
          element={<EventsPage user={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} ownStudentNumber={ownStudentNumber} />}
        />
        <Route
          path="/events/:eventId"
          element={<EventsPage user={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} ownStudentNumber={ownStudentNumber} />}
        />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    );
  }

  return (
    <>
      <AppShell user={currentUser} onLogout={currentUser ? handleLogout : undefined}>
        {routes}
      </AppShell>
      <Toast message={toast.message} visible={toast.visible} />
      {currentUser?.role === 'administrator' && builderFormId && (
        <SurveyCreatorModal
          key={builderFormId}
          formId={builderFormId}
          onClose={() => {
            builderReturnRef.current = null;
            setBuilderFormId(null);
          }}
          onApplied={() => {
            setBuilderFormId(null);
            const restoreView = builderReturnRef.current;
            builderReturnRef.current = null;
            showToast('Form saved.');
            restoreView?.();
          }}
        />
      )}
    </>
  );
}
