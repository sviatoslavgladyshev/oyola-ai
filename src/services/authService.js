// Firebase Authentication Service
// Note: In production, import from your firebase config
// import { auth } from '../firebase';

// Simulated authentication for demo purposes
// Replace with real Firebase auth in production

const USERS_KEY = 'property_platform_users';
const CURRENT_USER_KEY = 'property_platform_current_user';

// Get all users from localStorage
const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Sign up new user
export const signUp = async (userData) => {
  const { email, password, name, phone, role } = userData;
  
  // Validate input
  if (!email || !password || !name) {
    throw new Error('Please fill in all required fields');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check if user already exists
  const users = getUsers();
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    name,
    phone: phone || '',
    role: role || 'buyer', // buyer or owner
    createdAt: new Date().toISOString(),
    photoURL: null,
    bio: '',
    verified: false
  };

  users.push({ ...newUser, password }); // In real app, never store plain passwords
  saveUsers(users);

  // Set as current user (remove password from current user object)
  const { password: _, ...userWithoutPassword } = newUser;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

  return userWithoutPassword;
};

// Sign in existing user
export const signIn = async (email, password) => {
  if (!email || !password) {
    throw new Error('Please enter email and password');
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Set as current user (remove password)
  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

  return userWithoutPassword;
};

// Sign out
export const signOut = async () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Update user profile
export const updateProfile = async (updates) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === currentUser.id);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Update user data
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    password: users[userIndex].password // Keep password
  };

  users[userIndex] = updatedUser;
  saveUsers(users);

  // Update current user (remove password)
  const { password: _, ...userWithoutPassword } = updatedUser;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

  return userWithoutPassword;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const users = getUsers();
  const user = users.find(u => u.id === currentUser.id);

  if (!user || user.password !== currentPassword) {
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  saveUsers(users);

  return true;
};

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

