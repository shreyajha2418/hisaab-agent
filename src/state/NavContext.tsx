import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'decisions' }
  | { name: 'settings' }
  | { name: 'matchDetail'; eventId: string }
  | { name: 'customerDues'; customerId: string }
  | { name: 'uploadBills' }
  | { name: 'addCash' };

export type TabName = 'home' | 'decisions' | 'settings';

interface NavContextValue {
  route: Route;
  tab: TabName;
  navigate: (route: Route) => void;
  switchTab: (tab: TabName) => void;
  back: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [tab, setTab] = useState<TabName>('home');

  const value = useMemo<NavContextValue>(
    () => ({
      route: stack[stack.length - 1],
      tab,
      navigate: (route) => setStack((s) => [...s, route]),
      switchTab: (nextTab) => {
        setTab(nextTab);
        setStack([{ name: nextTab }]);
      },
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    }),
    [stack, tab]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
