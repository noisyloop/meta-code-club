import {Suspense, lazy} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {Theme} from '@astryxdesign/core/theme';
import {LinkProvider} from '@astryxdesign/core/Link';
import {LayerProvider} from '@astryxdesign/core/Layer';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {NavIcon} from '@astryxdesign/core/NavIcon';
import {Icon} from '@astryxdesign/core/Icon';
import {CalendarDays, Code2, Flag, LayoutDashboard, Rocket, Users} from 'lucide-react';
import {themes, defaultThemeSlug} from './astryx-themes';
import {ErrorBoundary} from './components/ErrorBoundary';
import {LoadingSkeleton, useDelayedFlag} from './components/QueryState';
import {RouterLink} from './components/RouterLink';
import {ThemeModeToggle} from './components/ThemeModeToggle';
import {useColorMode} from './useColorMode';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({default: m.DashboardPage})));
const MembersPage = lazy(() =>
  import('./pages/members/MembersPage').then(m => ({
    default: m.MembersPage,
  })),
);
const MemberDetailPage = lazy(() =>
  import('./pages/members/MemberDetailPage').then(m => ({
    default: m.MemberDetailPage,
  })),
);
const MemberFormPage = lazy(() =>
  import('./pages/members/MemberFormPage').then(m => ({
    default: m.MemberFormPage,
  })),
);
const ChallengesPage = lazy(() =>
  import('./pages/challenges/ChallengesPage').then(m => ({
    default: m.ChallengesPage,
  })),
);
const ChallengeDetailPage = lazy(() =>
  import('./pages/challenges/ChallengeDetailPage').then(m => ({
    default: m.ChallengeDetailPage,
  })),
);
const ChallengeFormPage = lazy(() =>
  import('./pages/challenges/ChallengeFormPage').then(m => ({
    default: m.ChallengeFormPage,
  })),
);
const ProjectsPage = lazy(() =>
  import('./pages/projects/ProjectsPage').then(m => ({
    default: m.ProjectsPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import('./pages/projects/ProjectDetailPage').then(m => ({
    default: m.ProjectDetailPage,
  })),
);
const ProjectFormPage = lazy(() =>
  import('./pages/projects/ProjectFormPage').then(m => ({
    default: m.ProjectFormPage,
  })),
);
const MeetupsPage = lazy(() =>
  import('./pages/meetups/MeetupsPage').then(m => ({
    default: m.MeetupsPage,
  })),
);
const MeetupDetailPage = lazy(() =>
  import('./pages/meetups/MeetupDetailPage').then(m => ({
    default: m.MeetupDetailPage,
  })),
);
const MeetupWizardPage = lazy(() =>
  import('./pages/meetups/MeetupWizardPage').then(m => ({
    default: m.MeetupWizardPage,
  })),
);
const MeetupCheckInPage = lazy(() =>
  import('./pages/meetups/MeetupCheckInPage').then(m => ({
    default: m.MeetupCheckInPage,
  })),
);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({default: m.NotFoundPage})));

function RouteFallback() {
  const show = useDelayedFlag(true);
  return show ? (
    <div style={{padding: 16}}>
      <LoadingSkeleton kind="detail" />
    </div>
  ) : null;
}

export function App() {
  const [mode, setMode] = useColorMode();
  const {pathname} = useLocation();

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={mode}>
      <LinkProvider component={RouterLink}>
        <LayerProvider>
          <AppShell
            contentPadding={0}
            sideNav={
              <SideNav
                collapsible
                header={
                  <SideNavHeading
                    heading="Code Club Hub"
                    headingHref="/"
                    icon={<NavIcon icon={<Icon icon={Code2} size="sm" />} />}
                  />
                }
                footer={<ThemeModeToggle mode={mode} onChange={setMode} />}
              >
                <SideNavSection title="Club">
                  <SideNavItem label="Dashboard" icon={LayoutDashboard} href="/" isSelected={pathname === '/'} />
                  <SideNavItem
                    label="Members"
                    icon={Users}
                    href="/members"
                    isSelected={pathname.startsWith('/members')}
                  />
                  <SideNavItem
                    label="Challenges"
                    icon={Flag}
                    href="/challenges"
                    isSelected={pathname.startsWith('/challenges')}
                  />
                  <SideNavItem
                    label="Projects"
                    icon={Rocket}
                    href="/projects"
                    isSelected={pathname.startsWith('/projects')}
                  />
                  <SideNavItem
                    label="Meetups"
                    icon={CalendarDays}
                    href="/meetups"
                    isSelected={pathname.startsWith('/meetups')}
                  />
                </SideNavSection>
              </SideNav>
            }
          >
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/members/new" element={<MemberFormPage />} />
                  <Route path="/members/:id" element={<MemberDetailPage />} />
                  <Route path="/members/:id/edit" element={<MemberFormPage />} />
                  <Route path="/challenges" element={<ChallengesPage />} />
                  <Route path="/challenges/new" element={<ChallengeFormPage />} />
                  <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
                  <Route path="/challenges/:id/edit" element={<ChallengeFormPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/new" element={<ProjectFormPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
                  <Route path="/meetups" element={<MeetupsPage />} />
                  <Route path="/meetups/new" element={<MeetupWizardPage />} />
                  <Route path="/meetups/:id" element={<MeetupDetailPage />} />
                  <Route path="/meetups/:id/edit" element={<MeetupWizardPage />} />
                  <Route path="/meetups/:id/checkin" element={<MeetupCheckInPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppShell>
        </LayerProvider>
      </LinkProvider>
    </Theme>
  );
}
