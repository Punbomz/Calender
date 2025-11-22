// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useTaskUpdate } from "../contexts/TaskContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Calendar,
  User,
  Plus,
  Trash2,
  CheckSquare,
  Inbox,
  ListTodo,
  Loader2,
  School,
} from "lucide-react";
import CreateCategoryModal from "./CreateCategoryModal";

interface Category {
  id: number;
  name: string;
  count: number;
}

interface Classroom {
  classroomID: string;
  name: string;
  taskCount: number;
}

type NavSection = "tasks" | "calendar" | "profile";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const categoryParam = searchParams.get("category");
  const classroomParam = searchParams.get("classroom");
  const { taskUpdateTrigger } = useTaskUpdate();

  const [activeSection, setActiveSection] = useState<NavSection>("tasks");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Update active section based on current pathname
  useEffect(() => {
    if (pathname.startsWith("/calendar")) {
      setActiveSection("calendar");
    } else if (pathname.startsWith("/profile")) {
      setActiveSection("profile");
    } else if (pathname.startsWith("/task")) {
      setActiveSection("tasks");
    }
  }, [pathname]);

  // Fetch tasks, categories, and classrooms when taskUpdateTrigger changes
  useEffect(() => {
    fetchTasksAndCategories();
    fetchClassrooms();
  }, [taskUpdateTrigger]);

  // Fetch classrooms using API
  const fetchClassrooms = async () => {
    try {
      const response = await fetch("/api/task/getAllClassrooms", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch classrooms: ${response.status}`);
      }

      const data = await response.json();
      console.log("📚 Classrooms fetched:", data);
      
      setClassrooms(data.classrooms || []);
    } catch (error) {
      console.error("❌ Error fetching classrooms:", error);
      setClassrooms([]);
    }
  };

  // Fetch tasks and categories
  const fetchTasksAndCategories = async () => {
    try {
      // Fetch all tasks
      const tasksResponse = await fetch("/api/task/gettask", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!tasksResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${tasksResponse.status}`);
      }

      const tasksData = await tasksResponse.json();
      const tasks = tasksData.tasks || [];

      // Count all active tasks (not finished)
      const activeTasks = tasks.filter((task: any) => !task.isFinished);
      setAllTasksCount(activeTasks.length);

      // Count completed tasks
      const completedTasks = tasks.filter((task: any) => task.isFinished);
      setCompletedTasksCount(completedTasks.length);

      // Fetch categories
      const categoriesResponse = await fetch("/api/task/getAllCategory", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!categoriesResponse.ok) {
        throw new Error(
          `Failed to fetch categories: ${categoriesResponse.status}`
        );
      }

      const categoriesData = await categoriesResponse.json();
      const fetchedCategories = categoriesData.categories || [];

      // Count tasks for each category
      const categoriesWithCount = fetchedCategories.map((category: any) => {
        const categoryName = category.categoryName || category.name;
        const categoryTasks = tasks.filter(
          (task: any) => task.category === categoryName
        );
        return {
          id: category.id,
          name: categoryName,
          count: categoryTasks.length || 0,
        };
      });

      setCategories(categoriesWithCount);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchTasksAndCategories();
    fetchClassrooms();
  }, []);

  // Add blur effect to body when sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileSidebarOpen]);

  const handleNavigation = (section: NavSection, path: string) => {
    setActiveSection(section);
    router.push(path);
    setIsMobileSidebarOpen(false);
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/task?category=${encodeURIComponent(categoryName)}`);
    setIsMobileSidebarOpen(false);
  };

  const handleClassroomClick = (classroomID: string) => {
    router.push(`/task?classroom=${encodeURIComponent(classroomID)}`);
    setIsMobileSidebarOpen(false);
  };

  const handleCreateCategory = (name: string) => {
    console.log("Category created:", name);
    fetchTasksAndCategories();
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (
      !confirm(`Are you sure you want to delete category "${categoryName}"?`)
    ) {
      return;
    }
    try {
      setIsDeleting(categoryName);
      const response = await fetch("/api/task/deleteCategory", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
      console.log(`Category "${categoryName}" deleted successfully`);
      fetchTasksAndCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(null);
      window.location.href = "/task";
    }
  };

  return (
    <>
      {/* Left Icon Sidebar (Narrow) - Dark Theme */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-16 bg-black text-white flex-col items-center py-4 z-50 border-r border-zinc-800">
        <button
          onClick={() => handleNavigation("profile", "/profile")}
          className="mb-6 p-2 rounded-lg hover:cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </button>

        <div className="flex-1 flex flex-col gap-4">
          <button
            onClick={() => handleNavigation("tasks", "/task")}
            className={`p-3 rounded-lg hover:cursor-pointer transition-colors ${
              activeSection === "tasks" ? "bg-blue-600" : "hover:bg-zinc-800"
            }`}
          >
            <CheckSquare size={24} />
          </button>

          <button
            onClick={() => handleNavigation("calendar", "/calendar")}
            className={`p-3 rounded-lg hover:cursor-pointer transition-colors ${
              activeSection === "calendar" ? "bg-blue-600" : "hover:bg-zinc-800"
            }`}
          >
            <Calendar size={24} />
          </button>
        </div>
      </aside>

      {/* Secondary Sidebar (Wide) - Dark Theme */}
      {pathname.startsWith("/task") && (
        <aside className="hidden lg:flex lg:fixed lg:left-16 lg:top-0 lg:h-screen lg:w-64 bg-zinc-900 border-r border-zinc-800 flex-col z-40">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">Calender</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1 mb-6">
              <button
                onClick={() => router.push("/task")}
                className={`w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/task" && !view && !categoryParam && !classroomParam
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-zinc-800"
                }`}
              >
                <Inbox size={18} />
                <span>All</span>
                <span className="ml-auto text-sm text-gray-400">
                  {allTasksCount}
                </span>
              </button>

              <button
                onClick={() => router.push("/task?view=completed")}
                className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/task" && view === "completed"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-zinc-800"
                }`}
              >
                <CheckSquare size={18} />
                <span>Completed</span>
                <span className="ml-auto text-sm text-gray-400">
                  {completedTasksCount}
                </span>
              </button>
            </div>

            {/* Classrooms Section */}
            {classrooms.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Classrooms
                  </h3>
                </div>
                <div className="space-y-1 mb-4">
                  {classrooms.map((classroom) => (
                    <button
                      key={classroom.classroomID}
                      onClick={() => handleClassroomClick(classroom.classroomID)}
                      className={`w-full hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        classroomParam === classroom.classroomID
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-zinc-800"
                      }`}
                    >
                      <School size={18} />
                      <span>{classroom.name}</span>
                      <span className="ml-auto text-sm text-gray-400">
                        {classroom.taskCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-2 group">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">
                  Categories
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded"
                >
                  <Plus
                    size={14}
                    className="text-gray-400 hover:cursor-pointer"
                  />
                </button>
              </div>
              <div className="space-y-1 mb-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`w-full hover:cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                      categoryParam === category.name
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-zinc-800"
                    }`}
                  >
                    <ListTodo size={18} />
                    <span>{category.name}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {category.count}
                      </span>
                      {isDeleting === category.name ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-blue-400"
                        />
                      ) : (
                        showDelete && (
                          <Trash2
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.name);
                            }}
                            size={16}
                            className="text-gray-400 hover:text-red-400 hover:cursor-pointer transition-colors"
                          />
                        )
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hover:cursor-pointer"
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add Category</span>
                </button>
                <button
                  onClick={() => setShowDelete(!showDelete)}
                  className={`p-2 rounded-lg transition-colors hover:cursor-pointer ${
                    showDelete
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:bg-zinc-800 hover:text-red-400"
                  }`}
                  title="Toggle delete mode"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile View */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-950 text-white p-4 flex items-center z-50 border-b border-zinc-800">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="hover:cursor-pointer flex items-center gap-2"
        >
          <Menu size={24} />
          <span className="text-xl font-semibold">Celender</span>
        </button>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-black text-white z-50 flex flex-col animate-slide-in shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xl font-semibold">Calender</span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="hover:cursor-pointer p-2 hover:bg-zinc-800 rounded transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <div className="space-y-1 mb-6">
                <button
                  onClick={() => router.push("/task")}
                  className={`w-full flex hover:cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/task" && !view && !categoryParam && !classroomParam
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-zinc-800"
                  }`}
                >
                  <Inbox size={18} />
                  <span>All</span>
                  <span className="ml-auto text-sm text-gray-400">
                    {allTasksCount}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/task?view=completed")}
                  className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/task" && view === "completed"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-zinc-800"
                  }`}
                >
                  <CheckSquare size={18} />
                  <span>Completed</span>
                  <span className="ml-auto text-sm text-gray-400">
                    {completedTasksCount}
                  </span>
                </button>
              </div>

              {/* Classrooms Section - Mobile */}
              {classrooms.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">
                      Classrooms
                    </h3>
                  </div>
                  <div className="space-y-1 mb-4">
                    {classrooms.map((classroom) => (
                      <button
                        key={classroom.classroomID}
                        onClick={() => handleClassroomClick(classroom.classroomID)}
                        className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          classroomParam === classroom.classroomID
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-zinc-800"
                        }`}
                      >
                        <School size={18} />
                        <span>{classroom.name}</span>
                        <span className="ml-auto text-sm text-gray-400">
                          {classroom.taskCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Section - Mobile */}
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Categories
                  </h3>
                </div>
                <div className="space-y-1 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.name)}
                      className={`hover:cursor-pointer w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                        categoryParam === category.name
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-zinc-800"
                      }`}
                    >
                      <ListTodo size={18} />
                      <span>{category.name}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-gray-400 group-hover:hidden">
                          {category.count}
                        </span>
                        {isDeleting === category.name ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-blue-400"
                          />
                        ) : (
                          showDelete && (
                            <Trash2
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.name);
                              }}
                              size={16}
                              className="text-gray-400 hover:text-red-400 hover:cursor-pointer transition-colors"
                            />
                          )
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hover:cursor-pointer"
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Category</span>
                  </button>
                  <button
                    onClick={() => setShowDelete(!showDelete)}
                    className={`p-1 rounded transition-colors ${
                      showDelete
                        ? "bg-red-600 text-white"
                        : "hover:bg-zinc-800 text-gray-400 hover:text-red-400"
                    }`}
                    title="Toggle delete buttons"
                  >
                    <Trash2 size={14} />
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
            onClick={() => handleNavigation("calendar", "/calendar")}
            className={`p-2 hover:cursor-pointer transition-colors ${
              activeSection === "calendar"
                ? "text-blue-400"
                : "hover:text-blue-400"
            }`}
          >
            <Calendar size={24} />
          </button>
          <button
            onClick={() => handleNavigation("tasks", "/task")}
            className={`p-2 hover:cursor-pointer transition-colors ${
              activeSection === "tasks"
                ? "text-blue-400"
                : "hover:text-blue-400"
            }`}
          >
            <CheckSquare size={24} />
          </button>
          <button
            onClick={() => handleNavigation("profile", "/profile")}
            className={`p-2 hover:cursor-pointer transition-colors ${
              activeSection === "profile"
                ? "text-blue-400"
                : "hover:text-blue-400"
            }`}
          >
            <User size={24} />
          </button>
        </div>
      </nav>

      <CreateCategoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCategory}
        title="Create Category"
      />
    </>
  );
}