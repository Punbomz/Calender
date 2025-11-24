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
  Star,
  Download,
  ExternalLink
} from "lucide-react";
import { auth } from '@/lib/firebaseClient';

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
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

        setCategories(data.categories || []);
      } catch (error: any) {
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

  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [filePreviews]);

  const formatDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    setNewFiles(filesArray);
    
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

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = newFiles.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
    
    setNewFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const handleRemoveExistingFile = (fileUrl: string) => {
    setFilesToRemove(prev => [...prev, fileUrl]);
  };

  const handleRestoreFile = (fileUrl: string) => {
    setFilesToRemove(prev => prev.filter(url => url !== fileUrl));
  };

  const getFileIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return '🖼️';
    if (lowerUrl.includes('.pdf')) return '📄';
    if (lowerUrl.match(/\.(doc|docx)$/)) return '📝';
    if (lowerUrl.match(/\.(xls|xlsx)$/)) return '📊';
    if (lowerUrl.match(/\.(ppt|pptx)$/)) return '📽️';
    return '📎';
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'file';
      return decodeURIComponent(fileName);
    } catch {
      return 'file';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!editedTask.title.trim()) {
        setError('กรุณากรอกชื่องาน');
        setIsSaving(false);
        return;
      }

      if (!editedTask.deadline) {
        setError('กรุณาเลือกกำหนดส่ง');
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

      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Delete marked files first
      if (filesToRemove.length > 0) {
        const userId = auth.currentUser?.uid;
        const deleteResponse = await fetch('/api/task/deleteAttachments', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            taskId: editedTask.id,
            fileUrls: filesToRemove,
          }),
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete attachments');
        }
      }

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
        attachments: data.task?.attachments ?? editedTask.attachments?.filter(url => !filesToRemove.includes(url)),
      };

      onSave(updatedTaskFromServer);
    } catch (error: any) {
      console.error('Error updating task:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการอัพเดตงาน');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-[#593831] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 border-2 border-[#5A3E2F] max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isSaving || deletingFile !== null}
          className="hover:cursor-pointer absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">แก้ไขงาน</h2>
            <p className="text-sm text-white/70 mt-1">
              แก้ไขข้อมูลงานของคุณ
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
                    value={editedTask.title}
                    onChange={handleInputChange}
                    placeholder="กรอกชื่องาน"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all placeholder:text-white/40 text-white"
                    disabled={isSaving}
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
                    value={formatDateTimeForInput(editedTask.deadline)}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all placeholder:text-white/40 text-white [color-scheme:dark]"
                    disabled={isSaving}
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
                    value={editedTask.priority}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none transition-all cursor-pointer text-white"
                    disabled={isSaving}
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
                    value={editedTask.category}
                    onChange={handleInputChange}
                    disabled={loadingCategories || isSaving}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none transition-all cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingCategories ? (
                      <option className="bg-[#593831] text-white">Loading...</option>
                    ) : categories.length === 0 ? (
                      <option className="bg-[#593831] text-white">No categories</option>
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
                  value={editedTask.description}
                  onChange={handleInputChange}
                  placeholder="เพิ่มรายละเอียดสั้นๆ"
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 resize-none transition-all placeholder:text-white/40 text-white"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Existing Files */}
            {editedTask.attachments && editedTask.attachments.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90">
                  ไฟล์แนบ ({editedTask.attachments.filter(f => !filesToRemove.includes(f)).length})
                </label>
                <div className="space-y-2">
                  {editedTask.attachments.map((fileUrl, index) => {
                    const isMarkedForRemoval = filesToRemove.includes(fileUrl);
                    const fileName = getFileName(fileUrl);
                    const icon = getFileIcon(fileUrl);
                    const isImage = fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 bg-white/10 border rounded-xl transition-all group ${
                          isMarkedForRemoval 
                            ? 'border-red-500 opacity-50' 
                            : 'border-white/20 hover:bg-white/15'
                        }`}
                      >
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isMarkedForRemoval ? 'text-white/50 line-through' : 'text-white'}`}>
                            {fileName}
                          </p>
                          {isMarkedForRemoval && (
                            <p className="text-xs text-red-300 mt-1">จะถูกลบเมื่อบันทึก</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isMarkedForRemoval && (
                            <>
                              {isImage && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                  title="ดูรูปภาพ"
                                >
                                  <ExternalLink size={18} />
                                </a>
                              )}
                              <a
                                href={fileUrl}
                                download
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                title="ดาวน์โหลด"
                              >
                                <Download size={18} />
                              </a>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => isMarkedForRemoval ? handleRestoreFile(fileUrl) : handleRemoveExistingFile(fileUrl)}
                            className={`hover:cursor-pointer p-2 text-white rounded-lg transition-colors ${
                              isMarkedForRemoval
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                            title={isMarkedForRemoval ? "คืนค่าไฟล์" : "ลบไฟล์"}
                            disabled={isSaving}
                          >
                            {isMarkedForRemoval ? (
                              <span className="text-sm font-bold">↶</span>
                            ) : (
                              <X size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Files Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                เพิ่มไฟล์ใหม่
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={isSaving}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer"
              />

              {newFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2 text-white/90">ไฟล์ที่เลือก ({newFiles.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {newFiles.map((file, index) => {
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
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveNewFile(index)}
                            className="hover:cursor-pointer absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="ลบไฟล์"
                          >
                            <X size={16} />
                          </button>
                          
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
                disabled={isSaving || deletingFile !== null}
                className="hover:cursor-pointer px-6 py-3 text-white/80 hover:text-white font-medium rounded-xl transition hover:bg-white/10"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving || deletingFile !== null}
                className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#593831] border-t-transparent"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการแก้ไข"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}