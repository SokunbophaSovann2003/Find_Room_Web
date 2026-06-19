"use client";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from "firebase/storage";
import { storage, isFirebaseConfigured } from "./firebase";
import { downscaleToBlob, downscalePhoto } from "./image";

// Upload a single room photo. In Firebase mode: downscale → Blob → Storage →
// return download URL. In demo mode: downscale → base64 data URL.
export async function uploadRoomPhoto(
  roomId: string,
  file: File,
  slotIndex: number
): Promise<string> {
  if (isFirebaseConfigured && storage) {
    const blob = await downscaleToBlob(file);
    const path = `rooms/${roomId}/${Date.now()}_${slotIndex}`;
    const photoRef = ref(storage, path);
    await uploadBytes(photoRef, blob, { contentType: "image/jpeg" });
    return getDownloadURL(photoRef);
  }
  return downscalePhoto(file);
}

// Delete all photos stored under rooms/{roomId}/ in Storage.
// Best-effort — ignores errors so Firestore deletion always completes.
export async function deleteRoomPhotos(roomId: string): Promise<void> {
  if (!isFirebaseConfigured || !storage) return;
  try {
    const folderRef = ref(storage, `rooms/${roomId}`);
    const list = await listAll(folderRef);
    await Promise.all(list.items.map((item) => deleteObject(item)));
  } catch {
    // Storage folder may not exist for demo-era rooms — ignore silently.
  }
}
