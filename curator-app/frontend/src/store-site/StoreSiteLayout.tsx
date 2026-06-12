import type { ReactNode } from 'react';

import { ToastProvider } from '../app/components/Toast';
import { StoreSiteFooter } from './StoreSiteFooter';
import { StoreSiteHeader } from './StoreSiteHeader';
import { STORE_SITE_STYLES } from './styles';
import { LP, type StoreNavKey } from './tokens';

interface StoreSiteLayoutProps {
  children: ReactNode;
  activeNav?: StoreNavKey;
  mainClassName?: string;
}

export function StoreSiteLayout({ children, activeNav, mainClassName = '' }: StoreSiteLayoutProps) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col justify-between font-sans selection:bg-[#efeee5]" style={{ backgroundColor: LP.bg, color: LP.onSurface }}>
        <style>{STORE_SITE_STYLES}</style>
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#31332b/3%_1px,transparent_1px)] [background-size:24px_24px] opacity-75" />
        <StoreSiteHeader active={activeNav} />
        <main className={`relative z-10 mx-auto w-full max-w-[1400px] flex-1 px-5 py-10 md:px-8 lg:px-12 md:py-14 ${mainClassName}`}>
          {children}
        </main>
        <StoreSiteFooter />
      </div>
    </ToastProvider>
  );
}
