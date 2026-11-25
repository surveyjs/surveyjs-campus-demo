import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthUser } from '../../types/auth';
import { homePath } from '../../ui/access';
import { cx } from '../../ui/components';
import { Icon } from '../../ui/Icon';

const NavItem: React.FC<{ label: string; path: string; active: boolean }> = ({ label, path, active }) => (
  <Link
    to={path}
    className="inline-flex h-9 items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted focus:bg-muted aria-[current=page]:bg-muted/50 aria-[current=page]:hover:bg-muted"
    aria-current={active ? 'page' : undefined}
  >
    {label}
  </Link>
);

interface AppShellProps {
  user: AuthUser | null;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, onLogout, children }) => {
  const { pathname } = useLocation();
  const at = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const student = user?.role === 'student';

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-312 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-5 md:px-6 xl:min-h-16 xl:flex-nowrap xl:gap-6 xl:py-0 xl:px-8">
          <Link
            to={user ? homePath(user.role) : '/login'}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-foreground"
          >
            <Icon name="book" className="size-4" />
            Acme Campus
          </Link>
          <nav
            className="order-3 flex min-h-9 basis-full flex-wrap items-center gap-1 xl:order-none xl:min-w-0 xl:basis-auto xl:flex-1 xl:flex-nowrap"
            aria-label="Primary navigation"
          >
            {!user ? null : student ? (
              <>
                <NavItem label="My Profile" path="/portal" active={at('/portal')} />
                <NavItem label="Events" path="/events" active={at('/events')} />
                <NavItem label="Courses" path="/courses" active={at('/courses')} />
                <NavItem label="Accommodation" path="/accommodation" active={at('/accommodation')} />
              </>
            ) : (
              <>
                <NavItem label="Manage Students" path="/manage" active={at('/manage') || at('/students')} />
                {user.role === 'administrator' && <NavItem label="Register Student" path="/register" active={at('/register')} />}
                <NavItem label="Events" path="/events" active={at('/events')} />
                <NavItem label="Courses" path="/courses" active={at('/courses')} />
                <NavItem label="Accommodation" path="/accommodation" active={at('/accommodation')} />
                <NavItem label="Settings" path="/settings" active={at('/settings')} />
              </>
            )}
          </nav>
          {user ? (
            <div className="account ml-auto flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
              <span>
                Logged in as <strong className="font-medium text-foreground">{user.fullName}</strong>
              </span>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted"
                aria-label="Log out"
                onClick={onLogout}
              >
                <Icon name="log-out" className="size-4" />
              </button>
            </div>
          ) : (
            <span className="ml-auto inline-flex h-5 shrink-0 items-center rounded-4xl border border-border px-2 text-xs font-medium whitespace-nowrap text-foreground">
              Local demo
            </span>
          )}
        </div>
      </header>
      <main
        className={cx(
          'mx-auto px-4 pb-(--campus-dock-offset) sm:px-5 md:px-6 xl:px-8',
          user ? 'max-w-312 pt-6 md:pt-10' : 'max-w-162 pt-8 md:pt-14',
        )}
      >
        {children}
        <footer className="mt-6 text-right text-sm text-muted-foreground">
          Local Campus demo · Changes are saved in the local database
        </footer>
      </main>
    </>
  );
};
