"use client";
import React, { useEffect, useState } from "react";
import { Save, LogOut, Paperclip, X } from "lucide-react";

// 1. กำหนด Type ของ Task ให้ชัดเจน
interface Task {
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
}

// Type สำหรับ Category
interface Category {
  id: string;
  categoryName: string;
  [key: string]: any; // สำหรับ fields อื่นๆ ถ้ามี
}

// 2. กำหนด Props สำหรับ Modal Component
interface AddTaskModalProps {
  newTask: Task;
  setNewTask: React.Dispatch<React.SetStateAction<Task>>;
  onSave: (files: File[]) => void;
  onClose: () => void;
}

// 3. Export Default สำหรับ Component หลัก
export default function AddTaskModal({
  newTask,
  setNewTask,
  onSave,
  onClose,
}: AddTaskModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  const[selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const[filePreviews, setFilePreviews] = useState<string[]>([]);

  // ดึง categories จาก API เมื่อ component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log("🔄 Fetching categories from /api/task/getAllCategory ...");
  
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
        const fetchedCategories = data.categories || [];
        setCategories(fetchedCategories);
        
        // ✅ ถ้ามี categories และ newTask.category ว่าง ให้เลือก category แรก
        if (fetchedCategories.length > 0 && !newTask.category) {
          setNewTask(prev => ({
            ...prev,
            category: fetchedCategories[0].categoryName
          }));
        }
      } catch (error: any) {
        console.error("❌ Error fetching categories:", error);
  
        // ✅ fallback: กรณี session หมดอายุหรือ API ล้มเหลว
        const fallbackCategories = [
          { id: "1", categoryName: "Subject 1" },
          { id: "2", categoryName: "Subject 2" },
          { id: "3", categoryName: "Subject 3" },
        ];
        setCategories(fallbackCategories);
        
        // เลือก category แรกถ้า newTask.category ว่าง
        if (!newTask.category) {
          setNewTask(prev => ({
            ...prev,
            category: fallbackCategories[0].categoryName
          }));
        }
      } finally {
        setLoadingCategories(false);
      }
    };
  
    fetchCategories();
  }, []); // เอา newTask ออกจาก dependency array เพื่อป้องกัน infinite loop

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [filePreviews]);

  // สร้างฟังก์ชันจัดการการเปลี่ยนแปลงสำหรับ Input ต่างๆ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask((prevTask: Task) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงของไฟล์แนบ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
    
    // Create preview URLs for images
    const newPreviews: string[] = [];
    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push(''); // Empty string for non-images
      }
    });
    
    // Revoke old preview URLs
    filePreviews.forEach(preview => {
      if (preview) URL.revokeObjectURL(preview);
    });
    
    setFilePreviews(newPreviews);
  };

  // Remove specific file
  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL of the removed file
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ก่อนส่ง
    if (!newTask.title.trim()) {
      setError("กรุณากรอกชื่องาน");
      return;
    }
    
    if (!newTask.category) {
      setError("กรุณาเลือกหมวดหมู่");
      return;
    }
    
    if (!newTask.deadline) {
      setError("กรุณาเลือกกำหนดส่ง");
      return;
    }
    
    setError("");
    onSave(selectedFiles);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#593831] text-white rounded-2xl shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center">เพิ่มงานใหม่</h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ฟอร์มการเพิ่มงาน */}
        <form onSubmit={handleSubmit}>
          
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-semibold mb-1">
              ชื่องาน (Title) <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={newTask.title}
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
              value={newTask.description}
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
                value={newTask.priority}
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
                หมวดหมู่ (Category) <span className="text-red-400">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={newTask.category}
                onChange={handleInputChange}
                disabled={loadingCategories}
                required
                className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCategories ? (
                  <option>Loading...</option>
                ) : categories.length === 0 ? (
                  <option value="">No categories</option>
                ) : (
                  <>
                    {!newTask.category && <option value="">เลือกหมวดหมู่</option>}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label htmlFor="deadline" className="block text-sm font-semibold mb-1">
              กำหนดส่ง (Deadline) <span className="text-red-400">*</span>
            </label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              value={newTask.deadline}
              onChange={handleInputChange}
              required
              className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
          </div>

          {/* File Attachment */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">
              แนบไฟล์ / รูปภาพ
            </label>
            <input
              type="file"
              name="files"
              multiple
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              onChange={handleFileChange}
              className="hover: cursor-pointer w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
            
            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">ไฟล์ที่เลือก ({selectedFiles.length})</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    const isPDF = file.type === 'application/pdf';
                    
                    return (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg border-2 border-white/20 hover:border-[#f0a69a] transition-all duration-200"
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
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="hover: cursor-pointer flex items-center gap-2 bg-white/20 text-white font-bold px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200"
            >
              <LogOut size={20} /> ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loadingCategories}
              className="hover: cursor-pointer flex items-center gap-2 bg-[#f0a69a] text-[#593831] font-bold px-4 py-2 rounded-lg hover:bg-[#ffc2b8] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} /> บันทึกงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}