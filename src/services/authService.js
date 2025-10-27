import { auth, db } from '../config/firebase';
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
export const signInWithGoogle = async (role = 'buyer', rememberMe = true) => {
  try {
    // Set persistence based on rememberMe preference
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create user document for new Google sign-in users
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName,
        role: role,
        phone: '',
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

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
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
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

  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw new Error(error.message);
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

