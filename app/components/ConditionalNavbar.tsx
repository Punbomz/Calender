// app/components/ConditionalNavbar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar ONLY on login and register pages
  // If you're on /profile or any other page, show the navbar
  const shouldHideNavbar = pathname === '/login' || pathname === '/register';
  
  if (shouldHideNavbar) {
    return null;
  }

  // Show navbar on all other pages (assuming middleware handles auth)
  return <Navbar />;
}