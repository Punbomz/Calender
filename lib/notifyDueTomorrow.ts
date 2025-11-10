import { sendNotification } from './firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const notifyDueTomorrow = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const snapshot = await db.collection('tasks').where('dueDate', '==', dateStr).get();

  for (const doc of snapshot.docs) {
    const task = doc.data();
    for (const userId of task.assignedTo) {
      const userSnap = await db.collection('users').doc(userId).get();
      const token = userSnap.data()?.fcmToken;
      if (token) {
        await sendNotification(token, 'งานใกล้ครบกำหนด!', `งาน "${task.title}" ต้องส่งภายในวันพรุ่งนี้`);
      }
    }
  }
};
