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
import {RouterLink} from './components/RouterLink';
import {ThemeModeToggle} from './components/ThemeModeToggle';
import {useColorMode} from './useColorMode';
import {DashboardPage} from './pages/DashboardPage';
import {MembersPage} from './pages/members/MembersPage';
import {MemberDetailPage} from './pages/members/MemberDetailPage';
import {MemberFormPage} from './pages/members/MemberFormPage';
import {ChallengesPage} from './pages/challenges/ChallengesPage';
import {ChallengeDetailPage} from './pages/challenges/ChallengeDetailPage';
import {ChallengeFormPage} from './pages/challenges/ChallengeFormPage';
import {ProjectsPage} from './pages/projects/ProjectsPage';
import {ProjectDetailPage} from './pages/projects/ProjectDetailPage';
import {ProjectFormPage} from './pages/projects/ProjectFormPage';
import {MeetupsPage} from './pages/meetups/MeetupsPage';
import {MeetupDetailPage} from './pages/meetups/MeetupDetailPage';
import {MeetupWizardPage} from './pages/meetups/MeetupWizardPage';
import {MeetupCheckInPage} from './pages/meetups/MeetupCheckInPage';
import {NotFoundPage} from './pages/NotFoundPage';

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
              footer={<ThemeModeToggle mode={mode} onChange={setMode} />}>
              <SideNavSection title="Club">
                <SideNavItem
                  label="Dashboard"
                  icon={LayoutDashboard}
                  href="/"
                  isSelected={pathname === '/'}
                />
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
          }>
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
        </AppShell>
        </LayerProvider>
      </LinkProvider>
    </Theme>
  );
}
