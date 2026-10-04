import { BottomNav as BladeBottomNav, BottomNavItem, CheckSquareIcon, HomeIcon, SettingsIcon } from '@razorpay/blade/components';
import { useNav } from '../state/NavContext';
import type { TabName } from '../state/NavContext';

const TABS: { name: TabName; title: string; icon: typeof HomeIcon }[] = [
  { name: 'home', title: 'Today', icon: HomeIcon },
  { name: 'decisions', title: 'Decisions', icon: CheckSquareIcon },
  { name: 'settings', title: 'Settings', icon: SettingsIcon },
];

export function BottomNav() {
  const { tab, switchTab } = useNav();

  return (
    <BladeBottomNav accessibilityLabel="Primary">
      {TABS.map(({ name, title, icon }) => (
        <BottomNavItem key={name} title={title} icon={icon} isActive={tab === name} onClick={() => switchTab(name)} />
      ))}
    </BladeBottomNav>
  );
}
