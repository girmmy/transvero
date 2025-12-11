// Authentication service functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { User } from "../types";

// Development fallback listeners and helpers (used when Firebase is not configured)
const devAuthListeners: Array<(user: User | null) => void> = [];

const notifyDevAuthListeners = (user: User | null) => {
  if (user) {
    localStorage.setItem("dev_auth_current", JSON.stringify(user));
  } else {
    localStorage.removeItem("dev_auth_current");
  }
  devAuthListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("dev auth listener error:", e);
    }
  });
};

export const createUser = async (
  email: string,
  password: string
): Promise<User> => {
  const useDevFallback = !auth && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const raw = localStorage.getItem("dev_auth_users");
    const users: Array<{ uid: string; email: string; password: string }> = raw
      ? JSON.parse(raw)
      : [];

    if (users.some((u) => u.email === email)) {
      throw new Error(getAuthErrorMessage("auth/email-already-in-use"));
    }

    const uid = `dev-${Date.now()}`;
    users.push({ uid, email, password });
    localStorage.setItem("dev_auth_users", JSON.stringify(users));
    const user = { uid, email, displayName: undefined } as User;
    notifyDevAuthListeners(user);
    return user;
  }

  if (!auth) throw new Error("Firebase not configured: cannot create user.");
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || "",
      displayName: userCredential.user.displayName || undefined,
    };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signInUser = async (
  email: string,
  password: string
): Promise<User> => {
  const useDevFallback = !auth && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const raw = localStorage.getItem("dev_auth_users");
    const users: Array<{ uid: string; email: string; password: string }> = raw
      ? JSON.parse(raw)
      : [];

    const found = users.find((u) => u.email === email);
    if (!found) {
      throw new Error(getAuthErrorMessage("auth/user-not-found"));
    }
    if (found.password !== password) {
      throw new Error(getAuthErrorMessage("auth/wrong-password"));
    }

    const user = { uid: found.uid, email: found.email, displayName: undefined } as User;
    notifyDevAuthListeners(user);
    return user;
  }

  if (!auth) throw new Error("Firebase not configured: cannot sign in.");
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || "",
      displayName: userCredential.user.displayName || undefined,
    };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const logoutUser = async (): Promise<void> => {
  const useDevFallback = !auth && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    localStorage.removeItem("dev_auth_current");
    notifyDevAuthListeners(null);
    return;
  }

  if (!auth) {
    return;
  }
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error("Failed to sign out. Please try again.");
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  const useDevFallback = !auth && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    devAuthListeners.push(callback);
    const rawCurrent = localStorage.getItem("dev_auth_current");
    const current = rawCurrent ? JSON.parse(rawCurrent) : null;
    setTimeout(() => callback(current), 0);
    return () => {
      const idx = devAuthListeners.indexOf(callback);
      if (idx !== -1) devAuthListeners.splice(idx, 1);
    };
  }

  if (!auth) {
    setTimeout(() => callback(null), 0);
    return () => {
      /* no-op unsubscribe */
    };
  }

  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || undefined,
      });
    } else {
      callback(null);
    }
  });
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "Email already registered. Please use a different email or sign in.";
    case "auth/invalid-email":
      return "Invalid email address. Please check your email format.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Authentication failed. Please try again.";
  }
};
