import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const markTutorialCompleted = async (userId) => {
  if (!userId) return;
  await setDoc(
    doc(db, 'users', userId),
    { tutorialCompleted: true, updatedAt: new Date().toISOString() },
    { merge: true }
  );
};

const userService = { markTutorialCompleted };
export default userService;


