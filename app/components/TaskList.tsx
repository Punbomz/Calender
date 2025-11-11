// app/components/TasksList.tsx
'use client';

import { useState } from 'react';
import { Calendar, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  taskName: string;
  description: string;
  category: string;
  createdAt: string;
  deadLine: string;
  isFinished: boolean;
  priorityLevel: number;
}

interface TasksListProps {
  initialTasks: Task[];
}

export default function TasksList({ initialTasks }: TasksListProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // This will re-fetch data from the server
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (initialTasks.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-xl">No tasks found</p>
        <p className="text-sm mt-2">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialTasks.map((task) => (
          <div
            key={task.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
          >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-white line-clamp-1">
                {task.taskName}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                  task.priorityLevel === 3
                    ? 'bg-red-500/20 text-red-400'
                    : task.priorityLevel === 2
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                P{task.priorityLevel}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>

            {/* Category */}
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-gray-500" />
              <span className="text-gray-300 text-sm">{task.category}</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-gray-300 text-sm">
                {new Date(task.deadLine).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span
                className={`text-sm font-medium ${
                  task.isFinished ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                {task.isFinished ? '✓ Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}