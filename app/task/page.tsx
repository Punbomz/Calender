// app/tasks/page.tsx - Client Component approach
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view'); // 'completed' or null (for 'all')
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'priority'>('all');
  const [showFinished, setShowFinished] = useState(false);

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

  const handleCheckboxChange = async (taskId: string, currentStatus: boolean) => {
    // TODO: Implement API call to update task status
    // For now, update local state
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFinished: !currentStatus } : task
      )
    );
  };

  // Determine which tasks to display based on view parameter
  const isCompletedView = viewParam === 'completed';
  
  // Filter tasks based on the view
  const displayTasks = isCompletedView 
    ? tasks.filter(task => task.isFinished)
    : tasks.filter(task => !task.isFinished);
  
  const finishedTasks = tasks.filter(task => task.isFinished);

  // Sort display tasks based on filter type
  const sortedDisplayTasks = [...displayTasks].sort((a, b) => {
    if (filterType === 'deadline') {
      return timestampToDate(a.deadLine).getTime() - timestampToDate(b.deadLine).getTime();
    }
    if (filterType === 'priority') {
      return b.priorityLevel - a.priorityLevel; // Higher priority first
    }
    return 0; // 'all' - no sorting
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Filter Buttons Skeleton */}
          <div className="flex gap-10 mb-6 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-24 h-10 bg-gray-300 rounded-full animate-pulse" />
            ))}
          </div>

          {/* Task Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-300 rounded-2xl p-5 shadow-md animate-pulse"
              >
                {/* Header skeleton */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-gray-400 rounded-md" />
                  <div className="flex-1 flex items-baseline justify-between">
                    <div className="h-6 bg-gray-400 rounded w-1/3" />
                    <div className="h-4 bg-gray-400 rounded w-20 ml-4" />
                  </div>
                </div>

                {/* Description skeleton */}
                <div className="mb-3">
                  <div className="h-4 bg-gray-400 rounded w-24 mb-2" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-400 rounded w-2/3" />
                    <div className="h-4 bg-gray-400 rounded w-16 ml-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        {/* Filter Buttons - Only show for non-completed view */}
        {!isCompletedView && (
          <div className="flex gap-10 mb-6 justify-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-6 py-2 rounded-full font-semibold transition-colors hover:cursor-pointer ${
                filterType === 'all'
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
        )}

        {/* Page Title for Completed View */}
        {isCompletedView && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Completed Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">{sortedDisplayTasks.length} task(s) completed</p>
          </div>
        )}

        {/* Tasks List */}
        {sortedDisplayTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">
              {isCompletedView ? 'No completed tasks' : 'No tasks found'}
            </p>
            <p className="text-sm mt-2">
              {isCompletedView ? 'Complete some tasks to see them here!' : 'Create your first task to get started!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDisplayTasks.map((task) => (
              <div
                key={task.id}
                className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md ${
                  isCompletedView ? 'opacity-75' : ''
                }`}
              >
                {/* Header with checkbox and title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 mt-1">
                    <button
                      onClick={() => handleCheckboxChange(task.id, task.isFinished)}
                      className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover: cursor-pointer"
                    >
                      {task.isFinished && (
                        <svg 
                          className="w-5 h-5 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={3} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between">
                    <h3 className={`text-xl font-bold leading-tight ${isCompletedView ? 'line-through' : ''}`}>
                      {task.taskName}
                    </h3>
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

        {/* Finished Tasks Section - Only show in "All" view (not completed view) */}
        {!isCompletedView && finishedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowFinished(!showFinished)}
              className="hover: cursor-pointer w-full bg-black text-white rounded-2xl p-4 font-semibold flex items-center justify-between transition-colors"
            >
              <span>Completed</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{finishedTasks.length}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showFinished ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Finished Tasks List */}
            {showFinished && (
              <div className="space-y-4 mt-4">
                {finishedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md opacity-75`}
                  >
                    {/* Header with checkbox and title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={() => handleCheckboxChange(task.id, task.isFinished)}
                        className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all"
                      >
                        {task.isFinished && (
                          <svg 
                            className="w-5 h-5 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={3} 
                              d="M5 13l4 4L19 7" 
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                      <div className="flex-1 min-w-0 flex items-baseline justify-between">
                        <h3 className="text-xl font-bold leading-tight line-through">{task.taskName}</h3>
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
          </div>
        )}

        {/* Add Button */}
        <button
          className="
            fixed 
            bottom-25 right-6 
            sm:bottom-25 sm:right-8 
            md:bottom-28 md:right-12 
            lg:bottom-32 lg:right-16 
            xl:bottom-10 xl:right-20
            w-16 h-16 
            lg:w-20 lg:h-20
            bg-black text-white rounded-full shadow-lg 
            flex items-center justify-center 
            hover:bg-gray-800 transition-all hover:scale-110
            hover: cursor-pointer
          "
          onClick={() => console.log('Add new task')}
        >
          <Plus size={32} className="lg:w-10 lg:h-10" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}