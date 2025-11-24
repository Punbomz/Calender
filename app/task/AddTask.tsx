"use client";
import React, { useEffect, useState } from "react";
import { 
  X, 
  AlertCircle, 
  Type, 
  Calendar, 
  BookOpen, 
  ChevronDown, 
  AlignLeft,
  Star
} from "lucide-react";

interface Task {
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
}

interface Category {
  id: string;
  categoryName: string;
  [key: string]: any;
}

interface AddTaskModalProps {
  newTask: Task;
  setNewTask: React.Dispatch<React.SetStateAction<Task>>;
  onSave: (files: File[]) => void;
  onClose: () => void;
}

export default function AddTaskModal({
  newTask,
  setNewTask,
  onSave,
  onClose,
}: AddTaskModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/task/getAllCategory", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response");
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch categories");
        }

        const fetchedCategories = data.categories || [];
        setCategories(fetchedCategories);
        
        if (fetchedCategories.length > 0 && !newTask.category) {
          setNewTask(prev => ({ ...prev, category: '' }));
        }
      } catch (error: any) {
        const fallbackCategories = [
          { id: "1", categoryName: "Subject 1" },
          { id: "2", categoryName: "Subject 2" },
          { id: "3", categoryName: "Subject 3" },
        ];
        setCategories(fallbackCategories);
        
        if (!newTask.category) {
          setNewTask(prev => ({ ...prev, category: fallbackCategories[0].categoryName }));
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [filePreviews]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask((prevTask: Task) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
    
    const newPreviews: string[] = [];
    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
      }
    });
    
    filePreviews.forEach(preview => {
      if (preview) URL.revokeObjectURL(preview);
    });
    
    setFilePreviews(newPreviews);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      setError("กรุณากรอกชื่องาน");
      return;
    }
    
    if (!newTask.deadline) {
      setError("กรุณาเลือกกำหนดส่ง");
      return;
    }
    
    setError("");
    setLoading(true);
    onSave(selectedFiles);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-[#593831] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 border-2 border-[#5A3E2F] max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={loading} 
          className="hover:cursor-pointer absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">เพิ่มงานใหม่</h2>
            <p className="text-sm text-white/70 mt-1">
              สร้างงานส่วนตัวของคุณ
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-900/40 border-l-4 border-red-500 text-red-200 rounded-r-lg text-sm flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-sm font-medium text-white/90">
                  ชื่องาน <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="text-white/50 group-focus-within:text-white/80 transition-colors" size={20} />
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    placeholder="เช่น Homework 1, Lab 1"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all placeholder:text-white/40 text-white"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label htmlFor="deadline" className="block text-sm font-medium text-white/90">
                  กำหนดส่ง <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-white/50 group-focus-within:text-white/80 transition-colors" size={20} />
                  </div>
                  <input
                    type="datetime-local"
                    id="deadline"
                    name="deadline"
                    value={newTask.deadline}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all placeholder:text-white/40 text-white [color-scheme:dark]"
                    disabled={loading}
                    min={new Date().toISOString().slice(0,16)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div className="space-y-1.5">
                <label htmlFor="priority" className="block text-sm font-medium text-white/90">
                  ความสำคัญ
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Star className="text-white/50 group-focus-within:text-white/80 transition-colors" size={20} />
                  </div>
                  <select
                    id="priority"
                    name="priority"
                    value={newTask.priority}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none transition-all cursor-pointer text-white"
                    disabled={loading}
                  >
                    <option value="3" className="bg-[#593831] text-white">High</option>
                    <option value="2" className="bg-[#593831] text-white">Medium</option>
                    <option value="1" className="bg-[#593831] text-white">Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="text-white/50" size={20} />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-medium text-white/90">
                  หมวดหมู่
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="text-white/50 group-focus-within:text-white/80 transition-colors" size={20} />
                  </div>
                  <select
                    id="category"
                    name="category"
                    value={newTask.category}
                    onChange={handleInputChange}
                    disabled={loadingCategories || loading}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none transition-all cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingCategories ? (
                      <option className="bg-[#593831] text-white">Loading...</option>
                    ) : categories.length === 0 ? (
                      <option value="" className="bg-[#593831] text-white">No categories</option>
                    ) : (
                      <>
                        <option value="" className="bg-[#593831] text-white">No categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.categoryName} className="bg-[#593831] text-white">
                            {cat.categoryName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="text-white/50" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-medium text-white/90">
                รายละเอียด
              </label>
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft className="text-white/50 group-focus-within:text-white/80 transition-colors" size={20} />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  placeholder="รายละเอียดเพิ่มเติมของงาน..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 resize-none transition-all placeholder:text-white/40 text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/90">
                แนบไฟล์ / รูปภาพ
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer"
              />

              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2 text-white/90">ไฟล์ที่เลือก ({selectedFiles.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedFiles.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      const isPDF = file.type === 'application/pdf';
                      
                      return (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg border-2 border-white/20 hover:border-white/40 transition-all duration-200"
                        >
                          {isImage && filePreviews[index] ? (
                            <div className="aspect-square bg-white/10">
                              <img
                                src={filePreviews[index]}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square bg-white/10 flex flex-col items-center justify-center p-3">
                              <div className="text-3xl mb-2">
                                {isPDF ? '📄' : '📎'}
                              </div>
                              <p className="text-xs text-center text-white/70 break-all line-clamp-2">
                                {file.name}
                              </p>
                            </div>
                          )}
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="hover:cursor-pointer absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="ลบไฟล์"
                          >
                            <X size={16} />
                          </button>
                          
                          {/* File size */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white p-1 text-center">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-4 border-t border-white/20 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="hover:cursor-pointer px-6 py-3 text-white/80 hover:text-white font-medium rounded-xl transition hover:bg-white/10"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || loadingCategories}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#593831] border-t-transparent"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกงาน"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}