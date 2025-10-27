'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, AlertCircle, Plus, LogOut, Save } from 'lucide-react';

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

function TaskPageInner() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view'); // 'completed' or null (for 'all')
  const isCompletedView = viewParam === 'completed';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'priority'>('all');
  const [showFinished, setShowFinished] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '2',
    category: 'Subject 1',
    deadline: '',
  });

  // ---------------------------
  // Fetch Tasks from API
  // ---------------------------
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/task/gettask', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ---------------------------
  // Helpers
  // ---------------------------
  const timestampToDate = (timestamp: { _seconds: number; _nanoseconds: number }) =>
    timestamp?._seconds ? new Date(timestamp._seconds * 1000) : new Date();

  const formatDate = (timestamp: { _seconds: number; _nanoseconds: number }) =>
    timestampToDate(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (timestamp: { _seconds: number; _nanoseconds: number }) =>
    timestampToDate(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const getCardColor = (priorityLevel: number) => {
    if (priorityLevel === 3) return 'bg-red-600';
    if (priorityLevel === 2) return 'bg-yellow-500';
    if (priorityLevel === 1) return 'bg-green-600';
    return 'bg-gray-500';
  };

  const handleCheckboxChange = async (taskId: string, currentStatus: boolean) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFinished: !currentStatus } : task
      )
    );
  };

  // ---------------------------
  // Save New Task
  // ---------------------------
  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      alert('⚠️ Please enter a title before saving!');
      return;
    }

    const newTaskObj: Task = {
      id: Date.now().toString(),
      taskName: newTask.title.trim(),
      description: newTask.description.trim(),
      category: newTask.category,
      createdAt: {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
      deadLine: {
        _seconds: newTask.deadline
          ? Math.floor(new Date(newTask.deadline).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
      isFinished: false,
      priorityLevel: parseInt(newTask.priority, 10),
    };

    try {
      setTasks(prev => [...prev, newTaskObj]);
      setNewTask({ title: '', description: '', priority: '2', category: 'Subject 1', deadline: '' });
      setShowAddModal(false);

      const toast = document.createElement('div');
      toast.innerText = '🎉 Task added successfully!';
      toast.className =
        'fixed bottom-10 right-10 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-500 z-[9999]';
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 500);
      }, 2000);
    } catch (error) {
      const toast = document.createElement('div');
      toast.innerText = '❌ Failed to save task!';
      toast.className =
        'fixed bottom-10 right-10 bg-red-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-500 z-[9999]';
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 500);
      }, 2000);
    }
  };

  // ---------------------------
  // Sorting & Filtering
  // ---------------------------
  const unfinishedTasks = tasks.filter(task => !task.isFinished);
  const finishedTasks = tasks.filter(task => task.isFinished);

  const sortedUnfinishedTasks = [...unfinishedTasks].sort((a, b) => {
    if (filterType === 'deadline') {
      return timestampToDate(a.deadLine).getTime() - timestampToDate(b.deadLine).getTime();
    }
    if (filterType === 'priority') {
      return b.priorityLevel - a.priorityLevel;
    }
    return 0;
  });

  // ---------------------------
  // Render Loading / Error
  // ---------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 p-6 flex justify-center items-center">
        <div className="text-gray-700 font-semibold">Loading tasks...</div>
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

  // ---------------------------
  // Main JSX
  // ---------------------------
  return (
    <div className="min-h-screen bg-gray-200 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Filter Buttons */}
        <div className="flex gap-10 mb-6 justify-center">
          {['all', 'deadline', 'priority'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors hover:cursor-pointer ${
                filterType === type
                  ? 'bg-black text-white'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Unfinished Tasks */}
        {sortedUnfinishedTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">
              {isCompletedView ? 'No completed tasks' : 'No tasks found'}
            </p>
            <p className="text-sm mt-2">
              {isCompletedView
                ? 'Complete some tasks to see them here!'
                : 'Create your first task to get started!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedUnfinishedTasks.map(task => (
              <div
                key={task.id}
                className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md ${
                  isCompletedView ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
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
                  <div className="flex-1 flex justify-between items-baseline">
                    <h3
                      className={`text-xl font-bold leading-tight ${
                        isCompletedView ? 'line-through' : ''
                      }`}
                    >
                      {task.taskName}
                    </h3>
                    <p className="text-sm opacity-90 ml-4 whitespace-nowrap">
                      {formatDate(task.deadLine)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold mb-1">Description</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-90 flex-1">
                      {task.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-1.5 ml-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {formatTime(task.deadLine)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Finished Tasks */}
        {finishedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowFinished(!showFinished)}
              className="w-full bg-black text-white rounded-2xl p-4 font-semibold flex items-center justify-between hover:bg-gray-800 transition-colors"
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

            {showFinished && (
              <div className="space-y-4 mt-4">
                {finishedTasks.map(task => (
                  <div
                    key={task.id}
                    className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md opacity-75`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => handleCheckboxChange(task.id, task.isFinished)}
                        className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all"
                      >
                        {task.isFinished && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 flex justify-between items-baseline">
                        <h3 className="text-xl font-bold line-through">{task.taskName}</h3>
                        <p className="text-sm opacity-90 ml-4 whitespace-nowrap">
                          {formatDate(task.deadLine)}
                        </p>
                      </div>
                    </div>
                    <div>
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

        {/* Add Task Button */}
        <button
          className="fixed bottom-10 right-10 w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110 cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#593831] text-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md relative">
            <h2 className="text-2xl font-bold mb-4">Add New Task</h2>

            {/* Title */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter title"
                className="w-full p-2 rounded-md text-black bg-white"
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add a brief description"
                className="w-full p-2 rounded-md text-black bg-white"
              />
            </div>

            {/* Priority */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full p-2 rounded-md text-black bg-white"
              >
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                value={newTask.category}
                onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                className="w-full p-2 rounded-md text-black bg-white"
              >
                <option>Subject 1</option>
                <option>Subject 2</option>
                <option>Subject 3</option>
              </select>
            </div>

            {/* Deadline */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Deadline</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full p-2 rounded-md text-black bg-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut size={18} /> Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-md hover:bg-gray-100"
              >
                <Save size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Wrapper Component
export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TaskPageInner />
    </Suspense>
  );
}
