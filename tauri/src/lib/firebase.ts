import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { ChatMessage, UserName } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyAjepohXaUGLh1oFi_y0AonLSzwtaXaMMo",
  authDomain: "dumb-chat.firebaseapp.com",
  projectId: "dumb-chat",
  storageBucket: "dumb-chat.appspot.com",
  messagingSenderId: "690483906060",
  appId: "1:690483906060:web:f77c3b2530d26ff9f09029",
  measurementId: "G-SHG1M3DSXE",
};

const CHAT_COLLECTION = "trevor-kyle-chat";

// Number of most-recent messages kept in the live realtime window, and the
// page size when scrolling back through older history.
export const PAGE_SIZE = 50;

const app = initializeApp(firebaseConfig);

// Persist the cache to IndexedDB so warm relaunches are served locally and
// only changed documents are billed as reads.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(undefined),
  }),
});

const chatCollection = collection(db, CHAT_COLLECTION);

function toMessage(d: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  return { id: d.id, ...(d.data() as Omit<ChatMessage, "id">) };
}

export interface OutgoingMessage {
  username: UserName;
  text?: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export async function sendMessage(message: OutgoingMessage): Promise<void> {
  await addDoc(chatCollection, {
    ...message,
    timestamp: serverTimestamp(),
    clientTimestamp: Date.now(),
  });
}

export async function editMessage(id: string, text: string): Promise<void> {
  await updateDoc(doc(db, CHAT_COLLECTION, id), { text, edited: true });
}

export async function removeMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, CHAT_COLLECTION, id));
}

export interface SnapshotResult {
  /** Newest PAGE_SIZE messages, ordered oldest→newest for display. */
  messages: ChatMessage[];
  /** Newly-arrived messages from the other user (for notifications). */
  addedFromOthers: ChatMessage[];
  /** True when older history likely exists beyond the current window. */
  hasMore: boolean;
}

/**
 * Subscribe to the most-recent message window. The realtime listener only
 * watches the newest PAGE_SIZE documents, so launch cost is bounded regardless
 * of total history size. Results are reversed to ascending order for display.
 */
export function subscribeToMessages(
  currentUser: UserName,
  onUpdate: (result: SnapshotResult) => void,
  onError: (error: Error) => void,
): () => void {
  const messagesQuery = query(
    chatCollection,
    orderBy("timestamp", "desc"),
    limit(PAGE_SIZE),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const addedFromOthers: ChatMessage[] = snapshot
        .docChanges()
        .filter(
          (change) =>
            change.type === "added" &&
            change.doc.data().username !== currentUser,
        )
        .map((change) => toMessage(change.doc));

      // Query is newest-first; reverse to oldest→newest for rendering.
      const messages = snapshot.docs.map(toMessage).reverse();

      onUpdate({
        messages,
        addedFromOthers,
        hasMore: snapshot.docs.length === PAGE_SIZE,
      });
    },
    (error) => onError(error as Error),
  );
}

export interface OlderResult {
  /** The previous page of messages, ordered oldest→newest for prepending. */
  messages: ChatMessage[];
  /** True when still-older history likely exists beyond this page. */
  hasMore: boolean;
}

/**
 * One-time fetch (no listener) of the page of messages immediately older than
 * `oldest`. Used for infinite scroll; charges plain reads only for the page
 * actually requested.
 */
export async function fetchOlderMessages(
  oldest: ChatMessage,
): Promise<OlderResult> {
  const cursor = oldest.timestamp ?? oldest.clientTimestamp;
  const olderQuery = query(
    chatCollection,
    orderBy("timestamp", "desc"),
    startAfter(cursor),
    limit(PAGE_SIZE),
  );

  const snapshot = await getDocs(olderQuery);
  return {
    messages: snapshot.docs.map(toMessage).reverse(),
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

