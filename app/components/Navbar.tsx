// components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Calendar, FileText, User, Plus, Trash2, ChevronDown, ChevronRight, Tag, CheckSquare, Inbox, ListTodo } from 'lucide-react';
import CreateCategoryModal from './CreateCategoryModal';

interface Category {
  id: number;
  name: string;
  count: number;
}

type NavSection = 'tasks' | 'calendar' | 'profile';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  
  const [activeSection, setActiveSection] = useState<NavSection>('tasks');
  const [isTaskExpanded, setIsTaskExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'YouTube', count: 12},
    { id: 2, name: 'To Do', count: 0},
    { id: 3, name: 'Work', count: 3},
  ]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  // Update active section based on current pathname
  useEffect(() => {
    if (pathname.startsWith('/calendar')) {
      setActiveSection('calendar');
    } else if (pathname.startsWith('/profile')) {
      setActiveSection('profile');
    } else {
      setActiveSection('tasks');
    }
  }, [pathname]);

  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
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
        const tasks = data.tasks || [];
        
        // Count all active tasks (not finished)
        const activeTasks = tasks.filter((task: any) => !task.isFinished);
        setAllTasksCount(activeTasks.length);
        
        // Count completed tasks
        const completedTasks = tasks.filter((task: any) => task.isFinished);
        setCompletedTasksCount(completedTasks.length);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, []);

  // Add blur effect to body when sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  const handleNavigation = (section: NavSection, path: string) => {
    setActiveSection(section);
    router.push(path);
    setIsMobileSidebarOpen(false); // Close mobile sidebar after navigation
  };

  const handleCreateCategory = (name: string) => {
    console.log("Category created:", name);
    // Add logic here to refresh categories or update state
    // You might want to fetch categories again or add the new category to state
  };

  return (
    <>
      {/* Left Icon Sidebar (Narrow) - Dark Theme */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-16 bg-black text-white flex-col items-center py-4 z-50 border-r border-zinc-800">
        {/* Profile Icon */}
        <button 
          onClick={() => handleNavigation('profile', '/profile')}
          className="mb-6 p-2 rounded-lg hover:cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </button>

        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-4">
          <button 
            onClick={() => handleNavigation('tasks', '/task')}
            className={`p-3 rounded-lg hover:cursor-pointer transition-colors ${activeSection === 'tasks' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}
          >
            <CheckSquare size={24} />
          </button>
          
          <button 
            onClick={() => handleNavigation('calendar', '/calendar')}
            className={`p-3 rounded-lg hover:cursor-pointer transition-colors ${activeSection === 'calendar' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}
          >
            <Calendar size={24} />
          </button>
        </div>
      </aside>

      {/* Secondary Sidebar (Wide) - Dark Theme */}
      <aside className="hidden lg:flex lg:fixed lg:left-16 lg:top-0 lg:h-screen lg:w-64 bg-zinc-900 border-r border-zinc-800 flex-col z-40">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            Calender
          </h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
           <div className="space-y-1 mb-6">
            <button 
              onClick={() => router.push('/task')}
              className={`w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                !view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-zinc-800'
              }`}
            >
              <Inbox size={18} />
              <span>All</span>
              <span className="ml-auto text-sm text-white-500">{allTasksCount}</span>
            </button>

            <button 
              onClick={() => router.push('/task?view=completed')}
              className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                view === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-zinc-800'
              }`}
            >
              <CheckSquare size={18} />
              <span>Completed</span>
              <span className="ml-auto text-sm text-white-500">{completedTasksCount}</span>
            </button>
          </div>

          {/* Category Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 mb-2 group">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Categories</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded"
              >
                <Plus size={14} className="text-gray-400 hover:cursor-pointer" />
              </button>
            </div>
            <div className="space-y-1 mb-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="w-full hover:cursor-pointer flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <ListTodo size={18} />
                  <span>{category.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {category.count > 0 && (
                      <>
                        <div className="w-2 h-2 rounded-full"></div>
                        <span className="text-sm text-white-500 group-hover:hidden">{category.count}</span>
                      </>
                    )}
                    {category.count === 0 && (
                      <div className="w-2 h-2 rounded-full group-hover:hidden"></div>
                    )}
                    <Trash2 size={16} className="text-gray-500 hidden group-hover:block hover:cursor-pointer hover:text-red-400" />
                  </div>
                </button>
              ))}
            </div>
            {/* Category Action Buttons */}
              <div className="flex items-center gap-2 px-3">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hover:cursor-pointer"
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add Category</span>
                </button>
                <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors hover:cursor-pointer text-gray-400 hover:text-red-400">
                  <Trash2 size={18} />
                </button>
              </div>
          </div>
        </div>
      </aside>

      {/* Mobile View */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-950 text-white p-4 flex items-center z-50 border-b border-zinc-800">
        <button 
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="hover:cursor-pointer flex items-center gap-2"
        >
          <Menu size={24} />
          <span className="text-xl font-semibold">
            Celender
          </span>
        </button>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-black text-white z-50 flex flex-col animate-slide-in shadow-2xl">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xl font-semibold">Calender</span>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="hover:cursor-pointer p-2 hover:bg-zinc-800 rounded transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Sidebar Content - Add padding bottom to prevent overlap */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
               <div className="space-y-1 mb-6">
                  <button 
                    onClick={() => router.push('/task')}
                    className={`w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      !view
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-zinc-800'
                    }`}
                  >
                    <Inbox size={18} />
                    <span>All</span>
                    <span className="ml-auto text-sm text-white-500">{allTasksCount}</span>
                  </button>

                  <button 
                    onClick={() => router.push('/task?view=completed')}
                    className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      view === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-zinc-800'
                    }`}
                  >
                    <CheckSquare size={18} />
                    <span>Completed</span>
                    <span className="ml-auto text-sm text-white-500">{completedTasksCount}</span>
                  </button>
                </div>

              {/* Category Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Categories</h3>
                </div>
                <div className="space-y-1 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className="hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors group"
                    >
                      <ListTodo size={18} />
                      <span>{category.name}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {category.count > 0 && (
                          <>
                            <div className="w-2 h-2 rounded-full"></div>
                            <span className="text-sm text-white-500 group-hover:hidden">{category.count}</span>
                          </>
                        )}
                        {category.count === 0 && (
                          <div className="w-2 h-2 rounded-full group-hover:hidden"></div>
                        )}
                        <Trash2 size={16} className="hover:cursor-pointer text-gray-500 hidden group-hover:block hover:text-red-400" />
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Category Action Buttons */}
                <div className="flex items-center gap-2 px-3">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hover:cursor-pointer"
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Category</span>
                  </button>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors hover:cursor-pointer text-gray-400 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black text-white border-t border-zinc-800 z-50">
        <div className="flex items-center justify-around p-4">
          <button 
            onClick={() => handleNavigation('calendar', '/calendar')}
            className={`p-2 hover:cursor-pointer transition-colors ${activeSection === 'calendar' ? 'text-blue-400' : 'hover:text-blue-400'}`}
          >
            <Calendar size={24} />
          </button>
          <button 
            onClick={() => handleNavigation('tasks', '/task')}
            className={`p-2 hover:cursor-pointer transition-colors ${activeSection === 'tasks' ? 'text-blue-400' : 'hover:text-blue-400'}`}
          >
            <CheckSquare size={24} />
          </button>
          <button 
            onClick={() => handleNavigation('profile', '/profile')}
            className={`p-2 hover:cursor-pointer transition-colors ${activeSection === 'profile' ? 'text-blue-400' : 'hover:text-blue-400'}`}
          >
            <User size={24} />
          </button>
        </div>
      </nav>

      {/* Create Category Modal */}
      <CreateCategoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCategory}
        title="Create Category"
      />
    </>
  );
}