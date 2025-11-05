'use client';

import { auth } from '@/lib/firebaseClient';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, AlertCircle, Plus, Edit2 } from 'lucide-react';
import AddTaskModal from './AddTask';
import EditTaskModal from './EditTask';

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

interface NewTask {
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
}

interface EditTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
  isFinished?: boolean;
}

function TaskPageInner() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const categoryParam = searchParams.get('category');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'priority'>('all');
  const [showFinished, setShowFinished] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    priority: '1',
    category: '',
    deadline: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<EditTask | null>(null);

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

  const handleSaveTask = async () => {
    try {
      // Validate before sending
      if (!newTask.title.trim()) {
        alert('กรุณากรอกชื่องาน');
        return;
      }
      
      if (!newTask.category) {
        alert('กรุณาเลือกหมวดหมู่');
        return;
      }
      
      if (!newTask.deadline) {
        alert('กรุณาเลือกกำหนดส่ง');
        return;
      }

      const deadlineDate = new Date(newTask.deadline);
      
      // Validate date
      if (isNaN(deadlineDate.getTime())) {
        alert('รูปแบบวันที่ไม่ถูกต้อง');
        return;
      }
      
      const taskData = {
        taskName: newTask.title.trim(),
        description: newTask.description.trim(),
        category: newTask.category.trim(),
        priorityLevel: parseInt(newTask.priority),
        deadLine: deadlineDate.toISOString(),
        isFinished: false,
      };

      console.log('📤 Sending task data:', taskData);

      const response = await fetch('/api/task/addtask', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const responseData = await response.json();
      console.log('📥 Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to add task');
      }

      // Success!
      setShowAddModal(false);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: '1',
        category: '',
        deadline: '',
      });
      
      // Refresh tasks
      await fetchTasks();
      
      alert('เพิ่มงานสำเร็จ!');
    } catch (err: any) {
      console.error('❌ Error adding task:', err);
      alert('เพิ่มงานไม่สำเร็จ: ' + err.message);
    }
  };

  const handleEditTask = (task: Task) => {
    const deadlineDate = timestampToDate(task.deadLine);
    const formattedDeadline = deadlineDate.toISOString().slice(0, 16);

    setEditingTask({
      id: task.id,
      title: task.taskName,
      description: task.description,
      priority: task.priorityLevel.toString(),
      category: task.category,
      deadline: formattedDeadline,
      isFinished: task.isFinished,
    });
    setShowEditModal(true);
  };

  const handleSaveEditedTask = (updatedTask: EditTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id
          ? {
              ...task,
              taskName: updatedTask.title,
              description: updatedTask.description,
              priorityLevel: parseInt(updatedTask.priority),
              category: updatedTask.category,
              deadLine: {
                _seconds: Math.floor(new Date(updatedTask.deadline).getTime() / 1000),
                _nanoseconds: 0,
              },
            }
          : task
      )
    );
    setShowEditModal(false);
    setEditingTask(null);
  };

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
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFinished: !currentStatus } : task
      )
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    const ok = confirm("ลบงานนี้จริงไหม?");
    if (!ok) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    const userId = auth.currentUser?.uid;

    try {
      const res = await fetch("/api/task/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId, userId }),
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (e) {
      alert("ลบไม่สำเร็จ จะรีโหลดรายการให้ใหม่");
      fetchTasks();
    }
  };

  // Filter tasks based on view and category
  const isCompletedView = viewParam === 'completed';
  
  let displayTasks = tasks;
  
  // Filter by completion status
  if (isCompletedView) {
    displayTasks = displayTasks.filter(task => task.isFinished);
  } else {
    displayTasks = displayTasks.filter(task => !task.isFinished);
  }
  
  // Filter by category if category parameter exists
  if (categoryParam) {
    displayTasks = displayTasks.filter(task => task.category === categoryParam);
  }
  
  const finishedTasks = tasks.filter(task => task.isFinished);
  // Also filter finished tasks by category if needed
  const filteredFinishedTasks = categoryParam 
    ? finishedTasks.filter(task => task.category === categoryParam)
    : finishedTasks;

  const sortedDisplayTasks = [...displayTasks].sort((a, b) => {
    if (filterType === 'deadline') {
      return timestampToDate(a.deadLine).getTime() - timestampToDate(b.deadLine).getTime();
    }
    if (filterType === 'priority') {
      return b.priorityLevel - a.priorityLevel;
    }
    return 0;
  });

  // Get view title
  const getViewTitle = () => {
    if (isCompletedView) return 'Completed Tasks';
    if (categoryParam) return categoryParam;
    return null;
  };

  const viewTitle = getViewTitle();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-10 mb-6 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-24 h-10 bg-gray-300 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-300 rounded-2xl p-5 shadow-md animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-gray-400 rounded-md" />
                  <div className="flex-1 flex items-baseline justify-between">
                    <div className="h-6 bg-gray-400 rounded w-1/3" />
                    <div className="h-4 bg-gray-400 rounded w-20 ml-4" />
                  </div>
                </div>
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
        {/* View Title */}
        {viewTitle && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{viewTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">{sortedDisplayTasks.length} task(s)</p>
          </div>
        )}

        {/* Filter Buttons - Only show when not in completed view and no category selected */}
        {!isCompletedView && !categoryParam && (
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

        {/* Filter Buttons - Show when category is selected but not completed view */}
        {!isCompletedView && categoryParam && (
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

        {sortedDisplayTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">
              {isCompletedView 
                ? 'No completed tasks' 
                : categoryParam 
                ? `No tasks in "${categoryParam}"` 
                : 'No tasks found'}
            </p>
            <p className="text-sm mt-2">
              {isCompletedView 
                ? 'Complete some tasks to see them here!' 
                : categoryParam
                ? `Create tasks in "${categoryParam}" category to see them here!`
                : 'Create your first task to get started!'}
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 mt-1">
                    <button
                      onClick={() => handleCheckboxChange(task.id, task.isFinished)}
                      className="w-7 h-7 rounded-md border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover:cursor-pointer"
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
                    <div className="flex items-center gap-2 ml-4 whitespace-nowrap">
                      <p className="text-sm opacity-90">{formatDate(task.deadLine)}</p>
                      {!isCompletedView && (
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1.5 rounded-md hover:bg-white/20 transition-all"
                          aria-label={`Edit ${task.taskName}`}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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

        {/* Completed Tasks Section - Only show when not in completed view and not filtering by category */}
        {!isCompletedView && !categoryParam && filteredFinishedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowFinished(!showFinished)}
              className="hover:cursor-pointer w-full bg-black text-white rounded-2xl p-4 font-semibold flex items-center justify-between transition-colors"
            >
              <span>Completed</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{filteredFinishedTasks.length}</span>
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
                {filteredFinishedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${getCardColor(task.priorityLevel)} rounded-2xl p-5 text-white shadow-md opacity-75`}
                  >
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
                    <div className="mb-3">
                      <p className="text-base font-semibold mb-1">Description</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm opacity-90 flex-1">{task.description || 'No description'}</p>
                        <div className="flex items-center gap-1.5 ml-4">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{formatTime(task.deadLine)}</span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="ml-3 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-sm border border-white/30"
                            aria-label={`Delete ${task.taskName}`}
                          >
                            Delete
                          </button>
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
          className="fixed bottom-25 right-6 sm:bottom-25 sm:right-8 md:bottom-28 md:right-12 lg:bottom-32 lg:right-16 xl:bottom-10 xl:right-20 w-16 h-16 lg:w-20 lg:h-20 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110 hover:cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={32} className="lg:w-10 lg:h-10" strokeWidth={2.5} />
        </button>

        {/* Add Task Modal */}
        {showAddModal && (
          <AddTaskModal
            newTask={newTask}
            setNewTask={setNewTask}
            onSave={handleSaveTask}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Task Modal */}
        {showEditModal && editingTask && (
          <EditTaskModal
            task={editingTask}
            onSave={handleSaveEditedTask}
            onClose={() => {
              setShowEditModal(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TaskPageInner />
    </Suspense>
  );
}