// app/test/page.tsx
'use client';

import { useState } from 'react';
import { Loader2, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [taskCount, setTaskCount] = useState(10);

  const createRandomTasks = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/task/create-random', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: taskCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tasks');
      }

      setMessage(data.message || `Successfully created ${data.count} tasks!`);
      console.log('Created tasks:', data.tasks);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTasks = async () => {
    if (!confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/task/create-random', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tasks');
      }

      setMessage(data.message || `Successfully deleted ${data.count} tasks!`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Task Testing Playground
          </h1>
          <p className="text-gray-600">
            Generate random tasks or clear your database for testing purposes
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Create Random Tasks Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Random Tasks
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of tasks to create (max 50)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={taskCount}
                  onChange={(e) => setTaskCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={createRandomTasks}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Tasks...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create {taskCount} Random Task{taskCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Delete All Tasks Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h2>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete ALL your tasks. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={deleteAllTasks}
              disabled={deleteLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deleting Tasks...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete All Tasks
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <a
            href="/tasks"
            className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors text-center"
          >
            View Tasks
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">What gets created?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Random task names from a pool of 15 options</li>
            <li>• Random descriptions and categories</li>
            <li>• Priority levels: 0-3 (randomly assigned)</li>
            <li>• Deadlines: Random dates within the next 30 days</li>
            <li>• 30% chance tasks are marked as finished</li>
          </ul>
        </div>
      </div>
    </div>
  );
}