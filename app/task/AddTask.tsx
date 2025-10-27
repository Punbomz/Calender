"use client";
import React from "react";
import { Save, LogOut } from "lucide-react";

// 1. กำหนด Type ของ Task ให้ชัดเจน
interface Task {
  title: string;
  description: string;
  priority: string;
  category: string;
  deadline: string;
}

// 2. กำหนด Props สำหรับ Modal Component
interface AddTaskModalProps {
  newTask: Task;
  // ใช้ Type ที่แน่นอนแทน 'any'
  setNewTask: React.Dispatch<React.SetStateAction<Task>>;
  onSave: () => void;
  onClose: () => void;
}

// 3. Export Default สำหรับ Component หลัก
export default function AddTaskModal({
  newTask,
  setNewTask,
  onSave,
  onClose,
}: AddTaskModalProps) {
  // สร้างฟังก์ชันจัดการการเปลี่ยนแปลงสำหรับ Input ต่างๆ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask((prevTask: Task) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#593831] text-white rounded-2xl shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center">เพิ่มงานใหม่</h2>

        {/* ฟอร์มการเพิ่มงาน */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          
          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-semibold mb-1">
              ชื่องาน (Title)
            </label>
            <input
              id="title"
              name="title" // เพิ่ม name attribute
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
              name="description" // เพิ่ม name attribute
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
                name="priority" // เพิ่ม name attribute
                value={newTask.priority}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg text-black bg-white border border-gray-300 appearance-none focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
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
                name="category" // เพิ่ม name attribute
                value={newTask.category}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg text-black bg-white border border-gray-300 appearance-none focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
              >
                <option value="Subject 1">Subject 1</option>
                <option value="Subject 2">Subject 2</option>
                <option value="Subject 3">Subject 3</option>
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
              name="deadline" // เพิ่ม name attribute
              type="date"
              value={newTask.deadline}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-black bg-white border border-gray-300 focus:ring-2 focus:ring-[#f0a69a] focus:border-[#f0a69a] transition-all duration-200"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
            <button
              type="button" // ต้องระบุ type="button" เพื่อไม่ให้ form ถูก submit
              onClick={onClose}
              className="flex items-center gap-2 bg-white/20 text-white font-bold px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200"
            >
              <LogOut size={20} /> ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#f0a69a] text-[#593831] font-bold px-4 py-2 rounded-lg hover:bg-[#ffc2b8] transition-all duration-200 shadow-md"
            >
              <Save size={20} /> บันทึกงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}