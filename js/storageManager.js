const DB_NAME = 'xgen-db';
const DB_VERSION = 1;
let dbPromise = null;

export function loadJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return response.json();
  });
}

export function saveLocalState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadLocalState(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function initDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('images')) {
        const store = db.createObjectStore('images', { keyPath: 'nonce' });
        store.createIndex('ts', 'ts');
      }
      if (!db.objectStoreNames.contains('dummies')) {
        const store = db.createObjectStore('dummies', { keyPath: 'id' });
        store.createIndex('name', 'name');
        store.createIndex('type', 'type');
      }
      if (!db.objectStoreNames.contains('referencePhotos')) {
        db.createObjectStore('referencePhotos', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function clearPersistedData() {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    if (db) db.close();
    dbPromise = null;
  }

  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

export async function saveImage(image) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put(image);
    tx.oncomplete = () => resolve(image);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllImages() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readonly');
    const request = tx.objectStore('images').getAll();
    request.onsuccess = () => resolve((request.result || []).sort((a, b) => b.ts - a.ts));
    request.onerror = () => reject(request.error);
  });
}

export async function pruneImages(cachedImages) {
  const images = cachedImages.slice(0, 24);
  const toDelete = cachedImages.slice(24);
  if (!toDelete.length) return images;
  const db = await initDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');
    for (const item of toDelete) store.delete(item.nonce);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return images;
}

export async function savePreset(preset) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dummies', 'readwrite');
    tx.objectStore('dummies').put(preset);
    tx.oncomplete = () => resolve(preset);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPresets() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dummies', 'readonly');
    const request = tx.objectStore('dummies').getAll();
    request.onsuccess = () => resolve((request.result || []).sort((a, b) => b.updatedAt - a.updatedAt));
    request.onerror = () => reject(request.error);
  });
}

export async function deletePresetById(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dummies', 'readwrite');
    tx.objectStore('dummies').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
