"use client";

import { useState } from "react";
import { 
  X, 
  AlertCircle, 
  Type, 
  Calendar, 
  BookOpen, 
  ChevronDown, 
  AlignLeft 
} from "lucide-react";

interface AddClassroomTaskModalProps {
  classroomId: string;
  classroomName: string;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function AddClassroomTaskModal({
  classroomId,
  classroomName,
  onClose,
  onTaskAdded,
}: AddClassroomTaskModalProps) {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    deadline: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!taskData.title.trim()) {
      setError("กรุณากรอกชื่องาน");
      return;
    }

    if (!taskData.deadline) {
      setError("กรุณาเลือกกำหนดส่ง");
      return;
    }

    setLoading(true);

    try {
      // เรียกใช้งาน API จริง
      const response = await fetch("/api/classroom/task/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          classroomId,
          taskName: taskData.title,
          description: taskData.description,
          deadLine: new Date(taskData.deadline).toISOString(),
          category: taskData.category || "Homework",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add task");
      }

      // Success
      onTaskAdded();
      onClose();
    } catch (err: any) {
      console.error("Error adding classroom task:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการเพิ่มงาน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-[#6B4E3D] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 border-2 border-[#5A3E2F]">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            disabled={loading} 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
            <X size={24} />
        </button>

        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">สร้างงานใหม่</h2>
                <p className="text-sm text-white/70 mt-1 flex items-center gap-2">
                    <BookOpen size={16} />
                    ห้องเรียน: <span className="font-medium text-white/90">{classroomName}</span>
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
                                value={taskData.title}
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
                                value={taskData.deadline}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm transition-all placeholder:text-white/40 text-white [color-scheme:dark]"
                                disabled={loading}
                                required
                            />
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
                            value={taskData.category}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none transition-all cursor-pointer text-white"
                            disabled={loading}
                        >
                            <option value="" className="bg-[#6B4E3D] text-white">เลือกหมวดหมู่ (ค่าเริ่มต้น: Homework)</option>
                            <option value="Homework" className="bg-[#6B4E3D] text-white">Homework (การบ้าน)</option>
                            <option value="Lab" className="bg-[#6B4E3D] text-white">Lab (ปฏิบัติการ)</option>
                            <option value="Project" className="bg-[#6B4E3D] text-white">Project (โครงงาน)</option>
                            <option value="Quiz" className="bg-[#6B4E3D] text-white">Quiz (สอบย่อย)</option>
                            <option value="Exam" className="bg-[#6B4E3D] text-white">Exam (สอบ)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="text-white/50" size={20} />
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
                            value={taskData.description}
                            onChange={handleInputChange}
                            placeholder="รายละเอียดเพิ่มเติมของงาน..."
                            rows={5}
                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 resize-none transition-all placeholder:text-white/40 text-white"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex items-center justify-end gap-4 border-t border-white/20 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-white/80 hover:text-white font-medium rounded-xl transition hover:bg-white/10"
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-white text-[#6B4E3D] hover:bg-white/90 font-medium rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#6B4E3D] border-t-transparent"></span>
                                กำลังบันทึก...
                            </>
                        ) : (
                            "เพิ่มงาน"
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
