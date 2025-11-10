import admin from 'firebase-admin';
import path from 'path';

const serviceAccount = require(path.resolve('config/serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendNotification = async (token: string, title: string, body: string) => {
  await admin.messaging().send({
    token,
    notification: {
      title,
      body,
    },
  });
};
