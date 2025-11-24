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
  Edit2,
  Save,
  Trash2,
  AlertCircle,
  ChevronDown
} from "lucide-react";

interface TaskDetailsModalProps {
  classroomId: string;
  taskId: string;
  onClose: () => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  userRole?: string;
  classroomName?: string;
}

interface TaskData {
  taskName: string;
  description: string;
  deadLine: string;
  category: string;
  createdAt: string;
  createdBy: string;
  files: string[];
}

export default function ClassroomTaskDetailsModal({
  classroomId,
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  userRole = "student",
  classroomName = "",
}: TaskDetailsModalProps) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [editedData, setEditedData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  const isTeacher = userRole === "teacher";

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/classroom/task/details?classroomId=${classroomId}&taskId=${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }

        const data = await response.json();
        console.log("📝 Task details received:", data);
        setTaskData(data.task);
        setEditedData(data.task);
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [classroomId, taskId]);

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

  const formatDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(taskData);
    setSelectedFiles([]);
    setFilePreviews([]);
    setFilesToRemove([]);
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "deadLine") {
      const isoDate = new Date(value).toISOString();
      setEditedData((prev) => prev ? ({
        ...prev,
        [name]: isoDate,
      }) : null);
    } else {
      setEditedData((prev) => prev ? ({
        ...prev,
        [name]: value,
      }) : null);
    }
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

  const handleRemoveNewFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const handleRemoveExistingFile = (fileUrl: string) => {
    setFilesToRemove(prev => [...prev, fileUrl]);
  };

  const handleRestoreFile = (fileUrl: string) => {
    setFilesToRemove(prev => prev.filter(url => url !== fileUrl));
  };

  const handleSave = async () => {
    if (!editedData) return;

    setError(null);

    if (!editedData.taskName.trim()) {
      setError("กรุณากรอกชื่องาน");
      return;
    }

    if (!editedData.deadLine) {
      setError("กรุณาเลือกกำหนดส่ง");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("classroomId", classroomId);
      formData.append("taskId", taskId);
      formData.append("taskName", editedData.taskName);
      formData.append("description", editedData.description);
      formData.append("deadLine", editedData.deadLine);
      formData.append("category", editedData.category);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("filesToRemove", JSON.stringify(filesToRemove));

      const response = await fetch("/api/classroom/task/update", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task");
      }

      const refreshResponse = await fetch(`/api/classroom/task/details?classroomId=${classroomId}&taskId=${taskId}`);
      const refreshData = await refreshResponse.json();
      setTaskData(refreshData.task);
      setEditedData(refreshData.task);
      
      setIsEditing(false);
      setSelectedFiles([]);
      setFilePreviews([]);
      setFilesToRemove([]);
      
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการอัพเดตงาน");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/classroom/task/delete", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classroomId,
          taskId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete task");
      }

      if (onTaskDeleted) onTaskDeleted();
      onClose();
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการลบงาน");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-[#593831] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 border-2 border-[#5A3E2F] max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          disabled={saving || deleting}
          className="hover:cursor-pointer absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? "แก้ไขงาน" : "รายละเอียดงาน"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <BookOpen size={16} className="text-white/70" />
              <p className="text-sm text-white/70">
                {isEditing ? "แก้ไขข้อมูลงานที่มอบหมาย" : `ห้องเรียน: `}
                {!isEditing && <span className="font-medium text-white/90">{classroomName || "Loading..."}</span>}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/40 border-l-4 border-red-500 text-red-200 rounded-r-lg text-sm flex items-center gap-3 mb-4">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && editedData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                    <Type size={18} />
                    ชื่องาน {isEditing && <span className="text-red-400">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="taskName"
                      value={editedData.taskName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder:text-white/40"
                      disabled={saving}
                      placeholder="เช่น Homework 1, Lab 1"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                      {editedData.taskName}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                    <Calendar size={18} />
                    กำหนดส่ง {isEditing && <span className="text-red-400">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      name="deadLine"
                      value={formatDateTimeForInput(editedData.deadLine)}
                      min={new Date().toISOString().slice(0,16)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-white [color-scheme:dark]"
                      disabled={saving}
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                      {formatDateTime(editedData.deadLine)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <BookOpen size={18} />
                  หมวดหมู่
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      name="category"
                      value={editedData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none text-white cursor-pointer"
                      disabled={saving}
                    >
                      <option value="Homework" className="bg-[#593831]">Homework (การบ้าน)</option>
                      <option value="Lab" className="bg-[#593831]">Lab (ปฏิบัติการ)</option>
                      <option value="Project" className="bg-[#593831]">Project (โครงงาน)</option>
                      <option value="Quiz" className="bg-[#593831]">Quiz (สอบย่อย)</option>
                      <option value="Exam" className="bg-[#593831]">Exam (สอบ)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="text-white/50" size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                    {editedData.category === "Homework" && "Homework (การบ้าน)"}
                    {editedData.category === "Lab" && "Lab (ปฏิบัติการ)"}
                    {editedData.category === "Project" && "Project (โครงงาน)"}
                    {editedData.category === "Quiz" && "Quiz (สอบย่อย)"}
                    {editedData.category === "Exam" && "Exam (สอบ)"}
                    {!["Homework", "Lab", "Project", "Quiz", "Exam"].includes(editedData.category) && editedData.category}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90 flex items-center gap-2">
                  <AlignLeft size={18} />
                  รายละเอียด
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editedData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="รายละเอียดเพิ่มเติมของงาน..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 resize-none text-white placeholder:text-white/40"
                    disabled={saving}
                  />
                ) : (
                  <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white min-h-[100px] whitespace-pre-wrap">
                    {editedData.description || <span className="text-white/50 italic">ไม่มีรายละเอียด</span>}
                  </div>
                )}
              </div>

              {editedData.files && editedData.files.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    ไฟล์แนบ ({editedData.files.filter(f => !filesToRemove.includes(f)).length})
                  </label>
                  <div className="space-y-2">
                    {editedData.files.map((fileUrl, index) => {
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
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                  title="ดู"
                                >
                                  <ExternalLink size={18} />
                                </a>
                              </>
                            )}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => isMarkedForRemoval ? handleRestoreFile(fileUrl) : handleRemoveExistingFile(fileUrl)}
                                className={`hover:cursor-pointer p-2 text-white rounded-lg transition-colors ${
                                  isMarkedForRemoval
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-red-500 hover:bg-red-600'
                                }`}
                                title={isMarkedForRemoval ? "คืนค่าไฟล์" : "ลบไฟล์"}
                                disabled={saving}
                              >
                                {isMarkedForRemoval ? (
                                  <span className="text-sm font-bold">↶</span>
                                ) : (
                                  <X size={18} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    เพิ่มไฟล์ใหม่
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={handleFileChange}
                    disabled={saving}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer"
                  />

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
              )}

              {!isEditing && taskData && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-white/60">
                    สร้างเมื่อ: {formatDateTime(taskData.createdAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && (
            <div className="pt-6 flex items-center justify-between border-t border-white/20 mt-6">
              <div>
                {!isEditing && editedData && isTeacher && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="hover:cursor-pointer px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        กำลังลบ...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        ลบงาน
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {editedData && (
                  <div className="row-gap-4 flex items-center gap-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="hover:cursor-pointer px-6 py-3 text-white/80 hover:text-white font-medium rounded-xl transition hover:bg-white/10"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#593831] border-t-transparent"></span>
                              กำลังบันทึก...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              บันทึก
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        {isTeacher && (
                          <button
                            onClick={handleEdit}
                            className="hover:cursor-pointer px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition shadow-lg flex items-center gap-2"
                          >
                            <Edit2 size={18} />
                            แก้ไข
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg"
                        >
                          ปิด
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {!editedData && (
                  <button
                    onClick={onClose}
                    className="hover:cursor-pointer px-8 py-3 bg-white text-[#593831] hover:bg-white/90 font-medium rounded-xl transition shadow-lg"
                  >
                    ปิด
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}