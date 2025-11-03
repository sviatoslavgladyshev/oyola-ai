import { auth, db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile as firebaseUpdateProfile, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail, 
  updatePassword, 
  confirmPasswordReset as firebaseConfirmPasswordReset, 
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// Helper function to get complete user profile from Firestore
const getUserProfile = async (user) => {
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return {
        ...user,
        ...userDoc.data(),
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
    }
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return user;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export const signUp = async (userData) => {
  const { email, password, name, role, phone } = userData;

  if (!email || !password || !name || !role || !phone) {
    throw new Error('Please fill in all required fields');
  }

  if (password.length < 6 || !/^[a-zA-Z0-9?!\-_@#$%^&*()_+/]+$/.test(password)) {
    throw new Error('Password must be between 6 and 100 characters and can only contain letters, numbers, and special characters');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await firebaseUpdateProfile(userCredential.user, { displayName: name });

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      role,
      phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Return combined user object with Firestore data
    return getUserProfile(userCredential.user);
  } catch (error) {
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead or use a different email.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else {
      throw new Error(error.message);
    }
  }
};

export const signIn = async (email, password, rememberMe = true) => {
  if (!email || !password) {
    throw new Error('Please enter email and password');
  }

  try {
    // Set persistence based on rememberMe preference
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Return combined user object with Firestore data
    return getUserProfile(userCredential.user);
  } catch (error) {
    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else {
      throw new Error('Invalid email or password.');
    }
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Sign in with Google
export const signInWithGoogle = async (role = null, rememberMe = true) => {
  try {
    // Set persistence based on rememberMe preference
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // Always use popup - never fall back to redirect
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Extract Google OAuth credential/access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    // Check if user document exists

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create user document for new Google sign-in users without role; collect it post-login
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName,
        role: '',
        phone: '',
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Persist Google token info to the user's Firestore document
    await setDoc(
      userDocRef,
      {
        gmail: {
          accessToken,
          providerId: credential?.providerId || 'google.com',
          storedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // Return combined user object with Firestore data
    return getUserProfile(user);
  } catch (error) {
    // Provide user-friendly error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked. Please allow popups for this site.');
    } else if (
      error.message?.includes('Cross-Origin-Opener-Policy') || 
      error.message?.includes('COOP') ||
      error.toString().includes('Cross-Origin-Opener-Policy')
    ) {
      console.error('COOP Error:', error);
      throw new Error('Browser security settings are blocking the popup. Please check your browser settings or try a different browser.');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }
};

// Handle redirect result to capture and store the Google access token after redirect sign-in
export const processGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName,
        role: '',
        phone: '',
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    await setDoc(
      userDocRef,
      {
        gmail: {
          accessToken,
          scope: 'https://www.googleapis.com/auth/gmail.compose',
          providerId: credential?.providerId || 'google.com',
          storedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return user;
  } catch (error) {
    // Ignore case where there is no redirect/pending result
    if (error?.code === 'auth/no-auth-event') return null;
    throw error;
  }
};

/**
 * Get Gmail OAuth authorization URL from server (for refresh tokens)
 * This initiates the server-side OAuth flow that provides refresh tokens
 */
export const getGmailAuthUrl = async () => {
  try {
    const getGmailAuthUrlFunction = httpsCallable(functions, 'getGmailAuthUrl');
    // Pass the current origin as redirect URI to fix redirect_uri_mismatch error
    // Ensure no trailing slash for exact match with Google OAuth Console
    const redirectUri = window.location.origin.replace(/\/$/, '');
    console.log('Gmail OAuth - Using redirect URI:', redirectUri);
    console.log('Gmail OAuth - Full URL:', window.location.href);
    const result = await getGmailAuthUrlFunction({ redirectUri });
    // Store redirectUri in sessionStorage so exchange can use it
    sessionStorage.setItem('gmail_redirect_uri', redirectUri);
    console.log('Gmail OAuth - Auth URL generated:', result.data.authUrl);
    return result.data.authUrl;
  } catch (error) {
    console.error('Error getting Gmail auth URL:', error);
    throw new Error(error.message || 'Failed to get Gmail authorization URL');
  }
};

/**
 * Exchange Gmail OAuth authorization code for tokens (with refresh token)
 * This completes the server-side OAuth flow
 */
export const exchangeGmailAuthCode = async (code, state) => {
  try {
    const exchangeGmailAuthCodeFunction = httpsCallable(functions, 'exchangeGmailAuthCode');
    // Get the redirect URI that was used for the auth URL
    let redirectUri = sessionStorage.getItem('gmail_redirect_uri') || window.location.origin;
    // Ensure no trailing slash for exact match
    redirectUri = redirectUri.replace(/\/$/, '');
    console.log('Gmail OAuth Exchange - Using redirect URI:', redirectUri);
    const result = await exchangeGmailAuthCodeFunction({ code, state, redirectUri });
    // Clean up stored redirect URI
    sessionStorage.removeItem('gmail_redirect_uri');
    return result.data;
  } catch (error) {
    console.error('Error exchanging Gmail auth code:', error);
    sessionStorage.removeItem('gmail_redirect_uri');
    throw new Error(error.message || 'Failed to exchange authorization code');
  }
};

/**
 * Refresh Gmail access token using stored refresh token
 */
export const refreshGmailToken = async () => {
  try {
    const refreshGmailTokenFunction = httpsCallable(functions, 'refreshGmailToken');
    const result = await refreshGmailTokenFunction();
    return result.data;
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    throw new Error(error.message || 'Failed to refresh token');
  }
};

/**
 * Initiate Gmail OAuth flow with refresh token support
 * Redirects user to Google OAuth consent screen
 */
export const authorizeGmailAccess = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be signed in to authorize Gmail access');
    }

    const authUrl = await getGmailAuthUrl();
    // Redirect to Google OAuth consent screen
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error initiating Gmail authorization:', error);
    throw error;
  }
};

export const updateProfile = async (updates) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  try {
    await firebaseUpdateProfile(currentUser, updates);
    return currentUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  if (newPassword.length < 6 || !/^[a-zA-Z0-9?!\-_@#$%^&*()_+/]+$/.test(newPassword)) {
    throw new Error('New password must be between 6 and 100 characters and can only contain letters, numbers, and special characters');
  }

  try {
    await updatePassword(currentUser, newPassword);
    return currentUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const sendPasswordResetEmail = async (email) => {
  if (!email) {
    throw new Error('Please enter email');
  }

  console.log('════════════════════════════════════════');
  console.log('🔍 DEBUG: Starting password reset process...');
  console.log('📧 Email:', email);
  console.log('🔐 Auth instance:', auth);
  console.log('🔐 Auth app:', auth.app);
  console.log('🌐 Auth current user:', auth.currentUser);
  console.log('════════════════════════════════════════');

  try {
    console.log('📤 Calling Firebase sendPasswordResetEmail...');
    await firebaseSendPasswordResetEmail(auth, email);
    console.log('════════════════════════════════════════');
    console.log('✅✅✅ SUCCESS: Firebase accepted the request ✅✅✅');
    console.log('📬 Email should be sent to:', email);
    console.log('⚠️⚠️⚠️ CHECK SPAM FOLDER IF NOT IN INBOX! ⚠️⚠️⚠️');
    console.log('════════════════════════════════════════');
    return true;
  } catch (error) {
    console.error('❌ ERROR: Failed to send password reset email');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Provide specific error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address. Please sign up first.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (error.code === 'auth/missing-email') {
      throw new Error('Please enter an email address.');
    } else {
      throw new Error(error.message || 'Failed to send reset email. Please try again.');
    }
  }
};

export const verifyPasswordResetCode = async (code) => {
  if (!code) {
    throw new Error('Please enter code');
  }

  try {
    return await firebaseVerifyPasswordResetCode(auth, code);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const confirmPasswordReset = async (code, newPassword) => {
  if (!code || !newPassword) {
    throw new Error('Please enter code and new password');
  }

  if (newPassword.length < 6 || !/^[a-zA-Z0-9?!\-_@#$%^&*()_+/]+$/.test(newPassword)) {
    throw new Error('New password must be between 6 and 100 characters and can only contain letters, numbers, and special characters');
  }

  try {
    await firebaseConfirmPasswordReset(auth, code, newPassword);
    return true;
  } catch (error) { 
    throw new Error(error.message);
  }
};





// Firebase Authentication Service
// Note: In production, import from your firebase config
// import { auth } from '../firebase';

// Simulated authentication for demo purposes
// Replace with real Firebase auth in production

// const USERS_KEY = 'property_platform_users';
// const CURRENT_USER_KEY = 'property_platform_current_user';

// // Get all users from localStorage
// const getUsers = () => {
//   const users = localStorage.getItem(USERS_KEY);
//   return users ? JSON.parse(users) : [];
// };

// // Save users to localStorage
// const saveUsers = (users) => {
//   localStorage.setItem(USERS_KEY, JSON.stringify(users));
// };

// // Get current user
// export const getCurrentUser = () => {
//   const user = localStorage.getItem(CURRENT_USER_KEY);
//   return user ? JSON.parse(user) : null;
// };

// // Sign up new user
// export const signUp = async (userData) => {
//   const { email, password, name, phone, role } = userData;
  
//   // Validate input
//   if (!email || !password || !name) {
//     throw new Error('Please fill in all required fields');
//   }

//   if (password.length < 6) {
//     throw new Error('Password must be at least 6 characters');
//   }

//   // Check if user already exists
//   const users = getUsers();
//   const existingUser = users.find(u => u.email === email);
  
//   if (existingUser) {
//     throw new Error('User with this email already exists');
//   }

//   // Create new user
//   const newUser = {
//     id: `user-${Date.now()}`,
//     email,
//     name,
//     phone: phone || '',
//     role: role || 'buyer', // buyer or owner
//     createdAt: new Date().toISOString(),
//     photoURL: null,
//     bio: '',
//     verified: false
//   };

//   users.push({ ...newUser, password }); // In real app, never store plain passwords
//   saveUsers(users);

//   // Set as current user (remove password from current user object)
//   const { password: _, ...userWithoutPassword } = newUser;
//   localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

//   return userWithoutPassword;
// };

// // Sign in existing user
// export const signIn = async (email, password) => {
//   if (!email || !password) {
//     throw new Error('Please enter email and password');
//   }

//   const users = getUsers();
//   const user = users.find(u => u.email === email && u.password === password);

//   if (!user) {
//     throw new Error('Invalid email or password');
//   }

//   // Set as current user (remove password)
//   const { password: _, ...userWithoutPassword } = user;
//   localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

//   return userWithoutPassword;
// };

// // Sign out
// export const signOut = async () => {
//   localStorage.removeItem(CURRENT_USER_KEY);
// };

// // Update user profile
// export const updateProfile = async (updates) => {
//   const currentUser = getCurrentUser();
  
//   if (!currentUser) {
//     throw new Error('No user signed in');
//   }

//   const users = getUsers();
//   const userIndex = users.findIndex(u => u.id === currentUser.id);

//   if (userIndex === -1) {
//     throw new Error('User not found');
//   }

//   // Update user data
//   const updatedUser = {
//     ...users[userIndex],
//     ...updates,
//     password: users[userIndex].password // Keep password
//   };

//   users[userIndex] = updatedUser;
//   saveUsers(users);

//   // Update current user (remove password)
//   const { password: _, ...userWithoutPassword } = updatedUser;
//   localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

//   return userWithoutPassword;
// };

// // Change password
// export const changePassword = async (currentPassword, newPassword) => {
//   const currentUser = getCurrentUser();
  
//   if (!currentUser) {
//     throw new Error('No user signed in');
//   }

//   if (newPassword.length < 6) {
//     throw new Error('New password must be at least 6 characters');
//   }

//   const users = getUsers();
//   const user = users.find(u => u.id === currentUser.id);

//   if (!user || user.password !== currentPassword) {
//     throw new Error('Current password is incorrect');
//   }

//   // Update password
//   user.password = newPassword;
//   saveUsers(users);

//   return true;
// };

// For production, use these Firebase Authentication methods:
/*
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword
} from 'firebase/auth';

export const signUp = async (userData) => {
  const { email, password, name } = userData;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(userCredential.user, { displayName: name });
  return userCredential.user;
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};
*/

