"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Type, 
  Calendar, 
  BookOpen, 
  AlignLeft,
  Download,
  ExternalLink,
  Clock,
  User,
  AlertCircle
} from "lucide-react";

interface TaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
}

interface TaskData {
  id: string;
  taskName: string;
  description: string;
  deadLine: string;
  category: string;
  classroom?: string;
  classroomName?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  priorityLevel: number;
  isFinished: boolean;
  attachments?: string[];
}

export default function TaskDetailsModal({
  taskId,
  onClose,
}: TaskDetailsModalProps) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/task/details?taskId=${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }

        const data = await response.json();
        console.log("📋 Task details received:", data);
        
        // If task has classroom, fetch classroom name
        if (data.task.classroom) {
          try {
            const { db } = await import('@/lib/firebaseClient');
            const { doc, getDoc } = await import('firebase/firestore');
            
            const classRef = doc(db, 'classrooms', data.task.classroom);
            const classSnap = await getDoc(classRef);
            
            if (classSnap.exists()) {
              data.task.classroomName = classSnap.data().name || data.task.classroom;
            }
          } catch (error) {
            console.error('Error fetching classroom name:', error);
          }
        }
        
        // createdByName is now provided by the API
        setTaskData(data.task);
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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

  const getPriorityLabel = (level: number) => {
    switch(level) {
      case 3: return { text: 'High', color: 'bg-red-500' };
      case 2: return { text: 'Medium', color: 'bg-yellow-500' };
      case 1: return { text: 'Low', color: 'bg-green-500' };
      default: return { text: 'Normal', color: 'bg-gray-500' };
    }
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      "Homework": "Homework (การบ้าน)",
      "Lab": "Lab (ปฏิบัติการ)",
      "Project": "Project (โครงงาน)",
      "Quiz": "Quiz (สอบย่อย)",
      "Exam": "Exam (สอบ)"
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-gradient-to-br from-[#593831] to-[#4a2e26] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 border-2 border-[#5A3E2F] max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="hover:cursor-pointer absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              รายละเอียดงาน
            </h2>
            {taskData?.classroom && taskData?.classroomName && (
              <div className="flex items-center gap-2 mt-2">
                <BookOpen size={16} className="text-white/70" />
                <p className="text-sm text-white/70">
                  ห้องเรียน: <span className="font-medium text-white/90">{taskData.classroomName}</span>
                </p>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/40 border-l-4 border-red-500 text-red-200 rounded-r-lg text-sm flex items-center gap-3 mb-4">
              <span>{error}</span>
            </div>
          )}

          {!loading && taskData && (
            <div className="space-y-6">
              {/* Task Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <Type size={18} />
                  ชื่องาน
                </label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-semibold">
                  {taskData.taskName}
                </div>
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    ระดับความสำคัญ
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-2 ${getPriorityLabel(taskData.priorityLevel).color} text-white rounded-lg font-semibold text-sm`}>
                      {getPriorityLabel(taskData.priorityLevel).text}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    สถานะ
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-2 ${taskData.isFinished ? 'bg-green-500' : 'bg-orange-500'} text-white rounded-lg font-semibold text-sm`}>
                      {taskData.isFinished ? '✓ เสร็จสิ้น' : '⏳ กำลังดำเนินการ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <Calendar size={18} />
                  กำหนดส่ง
                </label>
                <div className="flex items-center gap-4 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-white/70" />
                    <span>{formatDate(taskData.deadLine)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-white/70" />
                    <span>{formatTime(taskData.deadLine)}</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <BookOpen size={18} />
                  หมวดหมู่
                </label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                  {getCategoryDisplay(taskData.category)}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <AlignLeft size={18} />
                  รายละเอียด
                </label>
                <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white min-h-[100px] whitespace-pre-wrap">
                  {taskData.description || <span className="text-white/50 italic">ไม่มีรายละเอียด</span>}
                </div>
              </div>

              {/* Attachments */}
              {taskData.attachments && taskData.attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    ไฟล์แนบ ({taskData.attachments.length})
                  </label>
                  <div className="space-y-2">
                    {taskData.attachments.map((fileUrl, index) => {
                      const fileName = getFileName(fileUrl);
                      const icon = getFileIcon(fileUrl);
                      const isImage = fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all group"
                        >
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {fileName}
                            </p>
                          </div>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Creation Info */}
              <div className="pt-4 border-t border-white/20 space-y-1">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <User size={16} />
                  <span>สร้างโดย: {taskData.createdByName || 'ไม่ระบุ'}</span>
                </div>
                <p className="text-sm text-white/60">
                  สร้างเมื่อ: {formatDateTime(taskData.createdAt)}
                </p>
              </div>
            </div>
          )}

          {!loading && (
            <div className="pt-6 flex items-center justify-end border-t border-white/20 mt-6">
              <button
                onClick={onClose}
                className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg"
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}