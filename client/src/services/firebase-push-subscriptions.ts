import { collection, doc, getDocs, setDoc, deleteDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PushSubscription } from "@/types/firebase-types";

export async function savePushSubscription(
  subscriptionId: string,
  subscriptionToken?: string
): Promise<void> {
  const subscriptionsRef = collection(db, "pushSubscriptions");
  
  const q = query(
    subscriptionsRef,
    where("subscriptionId", "==", subscriptionId)
  );
  
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    const docRef = doc(db, "pushSubscriptions", existing.docs[0].id);
    await updateDoc(docRef, {
      status: 'subscribed',
      lastUpdated: new Date(),
      ...(subscriptionToken && { subscriptionToken }),
    });
  } else {
    const docRef = doc(subscriptionsRef);
    await setDoc(docRef, {
      subscriptionId,
      subscriptionToken: subscriptionToken || '',
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: 'subscribed',
    });
  }
}

export async function updatePushSubscriptionStatus(
  subscriptionId: string,
  status: 'subscribed' | 'unsubscribed'
): Promise<void> {
  const subscriptionsRef = collection(db, "pushSubscriptions");
  const q = query(
    subscriptionsRef,
    where("subscriptionId", "==", subscriptionId)
  );
  
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    const docRef = doc(db, "pushSubscriptions", existing.docs[0].id);
    await updateDoc(docRef, {
      status,
      lastUpdated: new Date(),
    });
  }
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const snapshot = await getDocs(collection(db, "pushSubscriptions"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
  } as PushSubscription));
}

export async function getActivePushSubscriptions(): Promise<PushSubscription[]> {
  const subscriptionsRef = collection(db, "pushSubscriptions");
  const q = query(
    subscriptionsRef,
    where("status", "==", "subscribed")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
  } as PushSubscription));
}

export async function deletePushSubscription(id: string): Promise<void> {
  await deleteDoc(doc(db, "pushSubscriptions", id));
}
