// functions/src/resetMonthly.ts

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
admin.initializeApp();

export const resetQuota = onSchedule(
  {
    schedule: "0 0 1 * *", // 1st of each month @ midnight
    timeZone: "Europe/Prague",
  },
  async () => {
    const users = await admin.firestore().collection("users").get();
    const batch = admin.firestore().batch();
    users.docs.forEach((doc) => batch.update(doc.ref, {keys_month: 0}));
    await batch.commit();
    logger.log("Monthly quota reset completed");
  }
);
