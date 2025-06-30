// functions/src/resetMonthly.ts
import * as functions from 'firebase-functions';
import admin          from 'firebase-admin';
admin.initializeApp();

export const resetQuota = functions.pubsub
  .schedule('0 0 1 * *')             // 1st of each month @ midnight
  .timeZone('Europe/Prague')
  .onRun(async () => {
    const users = await admin.firestore().collection('users').get();
    const batch = admin.firestore().batch();
    users.docs.forEach(doc => batch.update(doc.ref, { keys_month: 0 }));
    await batch.commit();
  });