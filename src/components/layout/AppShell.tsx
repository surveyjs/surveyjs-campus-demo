import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthUser } from '../../types/auth';
import { homePath } from '../../ui/access';
import { cx } from '../../ui/components';
import { Icon } from '../../ui/Icon';

const NavItem: React.FC<{ label: string; path: string; active: boolean }> = ({ label, path, active }) => (
  <Link
    to={path}
    className="relative flex items-center text-[10px] font-semibold whitespace-nowrap text-muted-foreground hover:text-primary aria-[current=page]:text-primary aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.75 aria-[current=page]:after:rounded-t-[3px] aria-[current=page]:after:bg-primary sm:text-xs xl:text-[13px]"
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
            className="flex shrink-0 items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-primary sm:gap-2.5 sm:text-xs xl:text-sm"
          >
            <Icon name="book" className="size-6 sm:size-7" />
            Acme Campus
          </Link>
          <nav
            className="order-3 flex min-h-9 basis-full flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6 xl:order-none xl:min-w-0 xl:basis-auto xl:flex-1 xl:flex-nowrap xl:gap-5"
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
              </>
            )}
          </nav>
          {user ? (
            <div className="account ml-auto flex items-center gap-2.25 text-[11px] whitespace-nowrap sm:gap-3 sm:text-xs xl:gap-4">
              <span>
                Logged in as <strong className="font-semibold">{user.fullName}</strong>
              </span>
              <button
                type="button"
                className="flex items-center gap-2 border-l border-border pl-2.25 text-muted-foreground hover:text-primary sm:pl-3 xl:pl-4"
                aria-label="Log out"
                onClick={onLogout}
              >
                <Icon name="log-out" className="size-4.5" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <span className="ml-auto inline-flex shrink-0 items-center rounded-full border border-border px-3 py-1.25 text-xs font-semibold whitespace-nowrap text-muted-foreground">
              Local demo
            </span>
          )}
        </div>
      </header>
      <main
        className={cx(
          'mx-auto px-4 pb-26 sm:px-5 md:px-6 xl:px-8',
          user ? 'max-w-312 pt-6 md:pt-9.5' : 'max-w-162.5 pt-7.5 md:pt-13.5',
        )}
      >
        {children}
        <footer className="mt-6.5 text-right text-[10px] text-subtle-foreground sm:text-[11px]">
          Local Campus demo · Changes are saved in the local database
        </footer>
      </main>
    </>
  );
};
