import { ReactNode } from 'react';
import { AudioMiniPlayer } from './AudioMiniPlayer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <AudioMiniPlayer />
    </>
  );
}
