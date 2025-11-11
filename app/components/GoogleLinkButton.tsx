'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';

interface GoogleLinkButtonProps {
  isLinked: boolean;
  userId: string;
}

export default function GoogleLinkButton({ isLinked, userId }: GoogleLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Clear error when isLinked status changes
  useEffect(() => {
    setError('');
  }, [isLinked]);

  const handleLinkGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      
      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      
      // Get the ID token
      const idToken = await result.user.getIdToken();

      // Call API to link the account
      const response = await fetch('/api/auth/link-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Google account');
      }

      // Refresh the page to show updated status
      router.refresh();
      
    } catch (err: any) {
      console.error('Link Google error:', err);
      setError(err.message || 'Failed to link Google account');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Are you sure you want to unlink your Google account?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/link-google', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Google account');
      }

      // If we got a custom token, sign in with it to switch sessions
      if (data.customToken) {
        try {
          const { signInWithCustomToken } = await import('firebase/auth');
          const userCredential = await signInWithCustomToken(auth, data.customToken);
          const idToken = await userCredential.user.getIdToken();
          
          // Create new session with email/password account
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });

          if (!sessionResponse.ok) {
            throw new Error('Failed to create new session');
          }

          // Refresh the page with new session
          router.refresh();
        } catch (authError) {
          console.error('Failed to switch session:', authError);
          // Fallback: redirect to login
          router.push('/login');
        }
      } else if (data.requiresReauth) {
        // No custom token provided, redirect to login
        router.push('/login');
      } else {
        // Just refresh the page to show updated status
        router.refresh();
      }
      
    } catch (err: any) {
      console.error('Unlink Google error:', err);
      setError(err.message || 'Failed to unlink Google account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {isLinked ? (
        <button
          onClick={handleUnlinkGoogle}
          disabled={loading}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:cursor-pointer"
        >
          {loading ? 'Unlinking...' : 'Unlink'}
        </button>
      ) : (
        <button
          onClick={handleLinkGoogle}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:cursor-pointer"
        >
          {loading ? 'Linking...' : 'Link Account'}
        </button>
      )}
      
      {error && (
        <p className="text-sm text-red-600 max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}