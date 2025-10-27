// app/components/MainContent.tsx
'use client';

import { usePathname } from 'next/navigation';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  
  // Check if we're on login or register pages
  const shouldHideNavbar = pathname === '/login' || pathname === '/register';
  
  // If no navbar, render children without any wrapper styling
  if (shouldHideNavbar) {
    return <>{children}</>;
  }
  
  // Otherwise, apply navbar spacing
  return (
    <main className="
      min-h-screen
      bg-zinc-950
      pt-16 lg:pt-0
      pb-20 lg:pb-0
      lg:ml-80
    ">
      {children}
    </main>
  );
}