// app/tasks/page.tsx - Client Component approach
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, Plus } from 'lucide-react';

interface Task {
  id: string;
  taskName: string;
  description: string;
  category: string;
  createdAt: { _seconds: number; _nanoseconds: number };
  deadLine: { _seconds: number; _nanoseconds: number };
  isFinished: boolean;
  priorityLevel: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'priority'>('all');
  const [isFinishedFilter, setIsFinishedFilter] = useState<'all' | 'finished'>('all');
  const [finishedCount, setFinishedCount] = useState(2);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/task/gettask', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full API response:', data);
      console.log('Tasks array:', data.tasks);
      
      setTasks(data.tasks || []);
      setFinishedCount(data.tasks?.filter((t: Task) => t.isFinished).length || 0);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const timestampToDate = (timestamp: { _seconds: number; _nanoseconds: number }) => {
    if (!timestamp || !timestamp._seconds) return new Date();
    return new Date(timestamp._seconds * 1000);
  };

  const formatDate = (timestamp: { _seconds: number; _nanoseconds: number }) => {
    const date = timestampToDate(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: { _seconds: number; _nanoseconds: number }) => {
    const date = timestampToDate(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getCardColor = (priorityLevel: number) => {
    if (priorityLevel === 3) return 'bg-red-600';
    if (priorityLevel === 2) return 'bg-yellow-500';
    if (priorityLevel === 1) return 'bg-green-600';
    return 'bg-gray-500';
  };

  const filteredTasks = tasks.filter(task => {
    if (isFinishedFilter === 'finished') {
      return task.isFinished;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="text-gray-800 text-xl">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <div className="text-red-600 flex items-center gap-2">
          <AlertCircle size={24} />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Filter Buttons */}
        <div className="flex gap-10 mb-6 justify-center">
          <button
            onClick={() => {
              setFilterType('all');
              setIsFinishedFilter('all');
            }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors hover:cursor-pointer ${
              filterType === 'all' && isFinishedFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('deadline')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors hover:cursor-pointer ${
              filterType === 'deadline'
                ? 'bg-black text-white'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            Deadline
          </button>
          <button
            onClick={() => setFilterType('priority')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors hover:cursor-pointer ${
              filterType === 'priority'
                ? 'bg-black text-white'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            Priority
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">No tasks found</p>
            <p className="text-sm mt-2">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md`}
              >
                {/* Header with checkbox and title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-7 h-7 rounded border-2 border-white flex items-center justify-center ${
                      task.isFinished ? 'bg-white' : 'bg-transparent'
                    }`}>
                      {task.isFinished && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between">
                    <h3 className="text-xl font-bold leading-tight">{task.taskName}</h3>
                    <p className="text-sm opacity-90 ml-4 whitespace-nowrap">{formatDate(task.deadLine)}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <p className="text-base font-semibold mb-1">Description</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-90 flex-1">{task.description || 'No description'}</p>
                    <div className="flex items-center gap-1.5 ml-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">{formatTime(task.deadLine)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Finished Filter */}
        {tasks.some(t => t.isFinished) && (
          <button
            onClick={() => setIsFinishedFilter(isFinishedFilter === 'all' ? 'finished' : 'all')}
            className="w-full bg-black text-white rounded-2xl p-4 mt-4 font-semibold flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span>Finished</span>
            <span className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {finishedCount}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        )}

        {/* Add Button */}
        <button
          className="fixed bottom-25 right-8 w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110"
          onClick={() => console.log('Add new task')}
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}