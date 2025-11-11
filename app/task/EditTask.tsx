"use client";
import React, { useEffect, useState } from "react";
import { Save, LogOut } from "lucide-react";
import { a, u } from "framer-motion/client";

// Type definitions
interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
  isFinished?: boolean;
  attachments?: string[];
}

interface Category {
  id: string;
  categoryName: string;
  [key: string]: any;
}

interface EditTaskModalProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onClose: () => void;
}

export default function EditTaskModal({
  task,
  onSave,
  onClose,
}: EditTaskModalProps) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Fetch categories from API
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log("🔄 Fetching categories from /api/task/getcategory ...");

      const response = await fetch("/api/task/getAllCategory", {
        method: "GET",
        credentials: "include", // ✅ ใช้ session cookie อัตโนมัติ
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Response status:", response.status);

      // ตรวจสอบ response format
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Response is not JSON:", text.substring(0, 200));
        throw new Error("API returned non-JSON response");
      }

      const data = await response.json();
      console.log("✅ Categories data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch categories");
      }

      // ✅ เซ็ต category จาก API
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error("❌ Error fetching categories:", error);

      // ✅ fallback: กรณี session หมดอายุหรือ API ล้มเหลว
      setCategories([
        { id: "1", categoryName: "Subject 1" },
        { id: "2", categoryName: "Subject 2" },
        { id: "3", categoryName: "Subject 3" },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  fetchCategories();
}, []);


  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!editedTask.title.trim()) {
        alert('กรุณากรอกชื่องาน');
        setIsSaving(false);
        return;
      }

      if (!editedTask.deadline) {
        alert('กรุณาเลือกกำหนดส่ง');
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("taskId", editedTask.id);
      formData.append("taskName", editedTask.title.trim());
      formData.append("description", editedTask.description.trim());
      formData.append("priorityLevel", editedTask.priority);
      formData.append("category", editedTask.category);
      formData.append("deadLine", editedTask.deadline);

    // ✅ แนบไฟล์ใหม่ (ถ้ามี)
      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch('/api/task/update', {
        method: 'PATCH',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update task');
      }

      const updatedTaskFromServer = {
        ...editedTask,
        attachments: data.task?.attachments ?? editedTask.attachments,
      }

      onSave(updatedTaskFromServer);
    } catch (error: any) {
      console.error('❌ Error updating task:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#593831] text-white rounded-2xl shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center">แก้ไขงาน</h2>

        {/* Edit Task Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-semibold mb-1">
              ชื่องาน (Title)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={editedTask.title}
              onChange={handleInputChange}
              placeholder="กรอกชื่องาน"
              required
              className="w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-semibold mb-1">
              รายละเอียด (Description)
            </label>
            <textarea
              id="description"
              name="description"
              value={editedTask.description}
              onChange={handleInputChange}
              placeholder="เพิ่มรายละเอียดสั้นๆ"
              rows={3}
              className="w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="mb-4">
              <label htmlFor="priority" className="block text-sm font-semibold mb-1">
                ความสำคัญ (Priority)
              </label>
              <select
                id="priority"
                name="priority"
                value={editedTask.priority}
                onChange={handleInputChange}
                className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
              >
                <option value="3">High</option>
                <option value="2">Medium</option>
                <option value="1">Low</option>
              </select>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-semibold mb-1">
                หมวดหมู่ (Category)
              </label>
              <select
                id="category"
                name="category"
                value={editedTask.category}
                onChange={handleInputChange}
                disabled={loadingCategories}
                className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCategories ? (
                  <option>Loading...</option>
                ) : categories.length === 0 ? (
                  <option>No categories</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label htmlFor="deadline" className="block text-sm font-semibold mb-1">
              กำหนดส่ง (Deadline)
            </label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              value={editedTask.deadline}
              onChange={handleInputChange}
              required
              className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
          </div>

          {/*New Attachment*/}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">
              แนบไฟล์ / รูปภาพ
            </label>
            <input
              type="file"
              name="files"
              multiple
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={(e) => {
                if (!e.target.files) return;
                const fileArray = Array.from(e.target.files);
                setNewFiles(fileArray);
              }}
              className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
            {newFiles.length > 0 && (
              <ul className="mt-2 text-xs text-white/80 space-y-1">
                {newFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            )}
            {editedTask.attachments && editedTask.attachments.length > 0 && (
            <div className="mb-4">
              <p className="block text-sm font-semibold mb-2 mt-2">ไฟล์ที่แนบอยู่แล้ว</p>
              <div className="grid grid-cols-2 gap-3">
                {editedTask.attachments.map((url, index) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                  const isPDF = /\.pdf$/i.test(url);
                  const fileName = url.split('/').pop()?.split('?')[0] || `Attachment ${index + 1}`;
                  
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group overflow-hidden rounded-lg border-2 border-white/20 hover:border-[#f0a69a] transition-all duration-200"
                    >
                      {isImage ? (
                        <div className="aspect-square bg-white/10">
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23593831"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23fff"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-white/10 flex flex-col items-center justify-center p-3">
                          <div className="text-3xl mb-2">
                            {isPDF ? '📄' : '📎'}
                          </div>
                          <p className="text-xs text-center text-white/70 break-all line-clamp-2">
                            {decodeURIComponent(fileName)}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold">
                          View
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="hover: cursor-pointer flex items-center gap-2 bg-white/20 text-white font-bold px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} /> ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="hover: cursor-pointer flex items-center gap-2 bg-[#f0a69a] text-[#593831] font-bold px-4 py-2 rounded-lg hover:bg-[#ffc2b8] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}