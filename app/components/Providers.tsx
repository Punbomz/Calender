'use client';

import { ReactNode } from 'react';
import TaskProvider from '../contexts/TaskContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TaskProvider>
      {children}
    </TaskProvider>
  );
}