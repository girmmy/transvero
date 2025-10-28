// Firestore service functions
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
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

export const deleteTranscript = async (
  userId: string,
  transcriptId: string
): Promise<void> => {
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
