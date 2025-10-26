// components/Navbar.tsx
'use client';

import { useState } from 'react';
import { Menu, Calendar, FileText, User, Plus, Trash2, ChevronDown, ChevronRight, Tag, CheckSquare, Inbox, ListTodo } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  count: number;
}

type NavSection = 'tasks' | 'calendar' | 'files' | 'profile';

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<NavSection>('tasks');
  const [isTaskExpanded, setIsTaskExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'YouTube', count: 12},
    { id: 2, name: 'To Do', count: 0},
    { id: 3, name: 'Work', count: 3},
  ]);

  return (
    <>
      {/* Left Icon Sidebar (Narrow) - Dark Theme */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-16 bg-zinc-950 text-white flex-col items-center py-4 z-50 border-r border-zinc-800">
        {/* Profile Icon */}
        <button className="mb-6 p-2 rounded-lg hover:cursor-pointer hover:bg-zinc-800 transition-colors">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </button>

        {/* Navigation Icons */}
        <div className="flex-1 flex flex-col gap-4">
          <button 
            onClick={() => setActiveSection('tasks')}
            className={`p-3 rounded-lg hover:cursor-pointer transition-colors ${activeSection === 'tasks' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}
          >
            <CheckSquare size={24} />
          </button>
          
          <button 
            onClick={() => setActiveSection('calendar')}
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
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Quick Views */}
          <div className="space-y-1 mb-6">
            <button className="w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <Inbox size={18} />
              <span>All</span>
            </button>
            <button className="w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <Calendar size={18} />
              <span>Deadline</span>
            </button>
            <button className="w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <Calendar size={18} />
              <span>Priority</span>
            </button>
          </div>

          {/* Category Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 mb-2 group">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Categories</h3>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded">
                <Plus size={14} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-1">
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
                        <span className="text-sm text-gray-500 group-hover:hidden">{category.count}</span>
                      </>
                    )}
                    {category.count === 0 && (
                      <div className="w-2 h-2 rounded-full group-hover:hidden"></div>
                    )}
                    <Trash2 size={16} className="text-gray-500 hidden group-hover:block" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Completed and Trash */}
          <div className="space-y-1">
            <button className="w-full hover:cursor-pointer flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
              <CheckSquare size={18} />
              <span>Completed</span>
            </button>
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
          <span className="text-xl font-semibold">Tasks</span>
        </button>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-zinc-900 text-white z-50 flex flex-col animate-slide-in">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xl font-semibold">Tasks</span>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="hover:cursor-pointer p-2 hover:bg-zinc-800 rounded"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Quick Views */}
              <div className="space-y-1 mb-6">
                <button className="hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Inbox size={18} />
                  <span>All</span>
                  <span className="ml-auto text-sm text-gray-500">15</span>
                </button>
                <button className="hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Calendar size={18} />
                  <span>Deadline</span>
                </button>
                <button className="hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Calendar size={18} />
                  <span>Priority</span>
                </button>
              </div>

              {/* Category Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 mb-2 group">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Categories</h3>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded">
                    <Plus size={14} className="hover:cursor-pointer text-gray-400" />
                  </button>
                </div>
                <div className="space-y-1">
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
                            <span className="text-sm text-gray-500 group-hover:hidden">{category.count}</span>
                          </>
                        )}
                        {category.count === 0 && (
                          <div className="w-2 h-2 rounded-full group-hover:hidden"></div>
                        )}
                        <Trash2 size={16} className="hover:cursor-pointer text-gray-500 hidden group-hover:block" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div className="space-y-1">
                <button className="hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  <CheckSquare size={18} />
                  <span>Completed</span>
                  <span className="ml-auto text-sm text-gray-500">3</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions in Sidebar */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex items-center justify-around">
                <button className="p-3 bg-white rounded-full text-black hover:bg-gray-200 transition-colors">
                  <Plus size={24} />
                </button>
                <button className="p-3 hover:bg-zinc-800 rounded-full transition-colors">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 text-white border-t border-zinc-800 z-50">
        <div className="flex items-center justify-around p-4">
          <button className="p-2">
            <Calendar size={24} />
          </button>
          <button className="p-2">
            <FileText size={24} />
          </button>
          <button className="p-2">
            <User size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Content Spacer */}
      <div className="lg:hidden pt-16 pb-20">
        {/* Your main content goes here */}
      </div>
    </>
  );
}