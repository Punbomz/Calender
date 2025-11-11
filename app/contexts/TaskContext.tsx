'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TaskContextType {
  taskUpdateTrigger: number;
  triggerTaskUpdate: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [taskUpdateTrigger, setTaskUpdateTrigger] = useState(0);

  const triggerTaskUpdate = useCallback(() => {
    setTaskUpdateTrigger(prev => prev + 1);
  }, []);

  return (
    <TaskContext.Provider value={{ taskUpdateTrigger, triggerTaskUpdate }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskUpdate() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskUpdate must be used within a TaskProvider');
  }
  return context;
}

// Export TaskProvider as default for easier imports
export default TaskProvider;