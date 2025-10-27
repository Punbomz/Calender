// app/components/MainContent.tsx
'use client';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
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