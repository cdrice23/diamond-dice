import { createContext, useContext, type PropsWithChildren } from 'react';

type NavLayoutContextValue = {
  navTopY: number | null;
};

const NavLayoutContext = createContext<NavLayoutContextValue>({ navTopY: null });

export function NavLayoutProvider({ navTopY, children }: PropsWithChildren<{ navTopY: number | null }>) {
  return <NavLayoutContext.Provider value={{ navTopY }}>{children}</NavLayoutContext.Provider>;
}

export function useNavLayout(): NavLayoutContextValue {
  return useContext(NavLayoutContext);
}