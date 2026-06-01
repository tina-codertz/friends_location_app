export { auth, firestore, db } from './config';
export {
  firebaseAuthErrorMessage,
  firestoreErrorMessage,
  firebaseLogout,
  isUsernameAvailable,
  loadAppUser,
  loginWithEmail,
  subscribeToAuthState,
  registerWithEmail,
  verifyCurrentUserPassword,
} from './auth-service';
export {
  clearAuthQuotaBackoff,
  ensureFirestoreSignedIn,
  getCircleMemberUids,
  isAuthQuotaExceeded,
} from './firestore/friends';
export { friendshipDocId } from './ids';
