'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function ClassroomPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode] = useState('9y9vn');

  const handleCreate = () => {
    if (className.trim()) {
      console.log('Creating class:', { name: className, code: classCode });
      setShowCreateModal(false);
      setClassName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-sm mx-auto">
          {/* Create and Join Buttons in Row */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 bg-amber-900 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-800 transition shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Create</span>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 bg-amber-900 text-white px-6 py-3 rounded-full font-bold hover:bg-amber-800 transition shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Join</span>
            </button>
          </div>

          {/* My Classrooms List */}
          <div className="bg-gray-400 rounded-lg p-4">
            <h2 className="text-black font-bold text-lg mb-3">My Classrooms</h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-full bg-white rounded-lg p-4 flex items-center gap-3 hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-amber-900 rounded flex items-center justify-center">
                  <span className="text-white">📚</span>
                </div>
                <span className="font-bold text-lg">CPE 334</span>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 flex items-center gap-3 hover:bg-gray-100 transition">
                <div className="w-8 h-8 bg-amber-900 rounded flex items-center justify-center">
                  <span className="text-white">📚</span>
                </div>
                <span className="font-bold text-lg">CPE 342</span>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 flex items-center gap-3 hover:bg-gray-100 transition">
                <div className="w-8 h-8 bg-amber-900 rounded flex items-center justify-center">
                  <span className="text-white">📚</span>
                </div>
                <span className="font-bold text-lg">PRE 380</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-amber-900 rounded-lg p-8 w-full max-w-sm shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={() => setShowCreateModal(false)}
              className="bg-amber-800 text-white px-4 py-2 rounded mb-6 text-sm hover:bg-amber-700 transition flex items-center gap-2"
            >
              <span>←</span>
              <span>Cancel</span>
            </button>

            <h2 className="text-white text-3xl font-bold mb-6">Create Class</h2>

            {/* Class Name Input */}
            <div className="mb-6">
              <label className="text-white font-bold mb-2 block">Name:</label>
              <input
                type="text"
                placeholder="Class Name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
            </div>

            {/* Class Code Display */}
            <div className="mb-6">
              <label className="text-white font-bold mb-2 block text-center underline">
                Class Code
              </label>
              <div className="bg-white rounded-lg p-6 text-center">
                <span className="text-5xl font-bold text-black">{classCode}</span>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="w-full bg-black text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-900 transition"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Info Modal Placeholder */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Classroom Info</h2>
            <p className="text-gray-600 mb-4">
              Import InfoClassroom component here
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Join Modal Placeholder */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Join Classroom</h2>
            <p className="text-gray-600 mb-4">
              Import JoinClassroom component here
            </p>
            <button
              onClick={() => setShowJoinModal(false)}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
