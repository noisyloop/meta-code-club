import {Route, Routes, useLocation} from 'react-router-dom';
import {Theme} from '@astryxdesign/core/theme';
import {LinkProvider} from '@astryxdesign/core/Link';
import {LayerProvider} from '@astryxdesign/core/Layer';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {NavIcon} from '@astryxdesign/core/NavIcon';
import {Icon} from '@astryxdesign/core/Icon';
import {Code2, LayoutDashboard, Users} from 'lucide-react';
import {themes, defaultThemeSlug} from './astryx-themes';
import {RouterLink} from './components/RouterLink';
import {ThemeModeToggle} from './components/ThemeModeToggle';
import {useColorMode} from './useColorMode';
import {DashboardPage} from './pages/DashboardPage';
import {MembersPage} from './pages/members/MembersPage';
import {MemberDetailPage} from './pages/members/MemberDetailPage';
import {MemberFormPage} from './pages/members/MemberFormPage';
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
              </SideNavSection>
            </SideNav>
          }>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/new" element={<MemberFormPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/members/:id/edit" element={<MemberFormPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
        </LayerProvider>
      </LinkProvider>
    </Theme>
  );
}
