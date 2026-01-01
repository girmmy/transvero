// Firestore service functions
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { Transcript } from "../types";

const COLLECTION_NAME = "transcripts";

export const saveTranscript = async (
  userId: string,
  transcript: Omit<Transcript, "id">
): Promise<string> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    const id = `dev-${Date.now()}`;
    const item: Transcript = {
      id,
      ...transcript,
      timestamp: new Date(transcript.timestamp).toISOString(),
    } as Transcript;
    items.unshift(item);
    localStorage.setItem(key, JSON.stringify(items));
    return id;
  }

  try {
    const docRef = await addDoc(
      collection(db, "users", userId, COLLECTION_NAME),
      {
        ...transcript,
        timestamp: Timestamp.fromDate(new Date(transcript.timestamp)),
      }
    );
    return docRef.id;
  } catch (error: any) {
    throw new Error("Failed to save transcript. Please try again.");
  }
};

export const getUserTranscripts = async (
  userId: string
): Promise<Transcript[]> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    return items;
  }

  try {
    const q = query(
      collection(db, "users", userId, COLLECTION_NAME),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString(),
    })) as Transcript[];
  } catch (error: any) {
    throw new Error("Failed to load transcripts. Please try again.");
  }
};

export const getTranscriptById = async (
  userId: string,
  transcriptId: string
): Promise<Transcript | null> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    return items.find((t) => t.id === transcriptId) || null;
  }

  try {
    const docRef = doc(db, "users", userId, COLLECTION_NAME, transcriptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      timestamp: docSnap.data().timestamp.toDate().toISOString(),
    } as Transcript;
  } catch (error: any) {
    throw new Error("Failed to load transcript. Please try again.");
  }
};

export const appendToTranscript = async (
  userId: string,
  transcriptId: string,
  newContent: string
): Promise<void> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    const updated = items.map((t) =>
      t.id === transcriptId
        ? { ...t, content: t.content + "\n\n" + newContent }
        : t
    );
    localStorage.setItem(key, JSON.stringify(updated));
    return;
  }

  try {
    const docRef = doc(db, "users", userId, COLLECTION_NAME, transcriptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Transcript not found.");
    }

    const currentContent = docSnap.data().content as string;
    await updateDoc(docRef, {
      content: currentContent + "\n\n" + newContent,
    });
  } catch (error: any) {
    throw new Error("Failed to append to transcript. Please try again.");
  }
};

export const updateTranscript = async (
  userId: string,
  transcriptId: string,
  updates: Partial<Transcript>
): Promise<void> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    const updated = items.map((t) =>
      t.id === transcriptId ? { ...t, ...updates } : t
    );
    localStorage.setItem(key, JSON.stringify(updated));
    return;
  }

  try {
    await updateDoc(
      doc(db, "users", userId, COLLECTION_NAME, transcriptId),
      updates
    );
  } catch (error: any) {
    throw new Error("Failed to update transcript. Please try again.");
  }
};

export const deleteTranscript = async (
  userId: string,
  transcriptId: string
): Promise<void> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter((t) => t.id !== transcriptId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return;
  }

  try {
    await deleteDoc(doc(db, "users", userId, COLLECTION_NAME, transcriptId));
  } catch (error: any) {
    throw new Error("Failed to delete transcript. Please try again.");
  }
};

export const searchTranscripts = async (
  userId: string,
  searchTerm: string
): Promise<Transcript[]> => {
  const useDevFallback = !db && process.env.NODE_ENV === "development";
  if (useDevFallback) {
    const key = `dev_transcripts_${userId}`;
    const raw = localStorage.getItem(key);
    const items: Transcript[] = raw ? JSON.parse(raw) : [];
    return items.filter(
      (transcript) =>
        transcript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transcript.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  try {
    const q = query(
      collection(db, "users", userId, COLLECTION_NAME),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);

    const allTranscripts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString(),
    })) as Transcript[];

    // Client-side filtering since Firestore doesn't support full-text search
    return allTranscripts.filter(
      (transcript) =>
        transcript.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transcript.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error: any) {
    throw new Error("Failed to search transcripts. Please try again.");
  }
};
