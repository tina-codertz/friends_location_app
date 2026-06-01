export { auth, firestore, db } from '@/firebase/config';
export {
  firebaseAuthErrorMessage,
  firestoreErrorMessage,
  firebaseLogout,
  isUsernameAvailable,
  loadAppUser,
  loginWithEmail,
  onAuthStateChanged,
  registerWithEmail,
  verifyCurrentUserPassword,
} from '@/firebase/auth';
export {
  clearAuthQuotaBackoff,
  ensureFirestoreSignedIn,
  getCircleMemberUids,
  isAuthQuotaExceeded,
} from '@/firebase/firestore/friends';
export { friendshipDocId } from '@/firebase/ids';
