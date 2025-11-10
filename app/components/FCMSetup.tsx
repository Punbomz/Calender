import { useEffect } from 'react';
import { messaging } from '@/lib/firebaseClient';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseFirestore'; 

export default function FCMSetup({ userId }: { userId: string }) {
  useEffect(() => {
    Notification.requestPermission().then(async (permission) => {
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BM-ldQs4-eCmojS364h7csG_5s8ptV3BDqsT1dTbBB5IUZ5YWw4U5Jeq24L0FKk1EIxOkkFIZLhyzbguqtGEs2s',
        });
        console.log('FCM Token:', token);
        await setDoc(doc(db, 'users', userId), { fcmToken: token }, { merge: true });
      }
    });

    onMessage(messaging, (payload) => {
      alert(`📢 ${payload.notification?.title}: ${payload.notification?.body}`);
    });
  }, [userId]);

  return null;
}
