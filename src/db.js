const dbName = 'FarmInspectionDB';
const dbVersion = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history');
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveToDB = async (storeName, key, value) => {
  try {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error("IndexedDB Save Error:", err);
  }
};

export const getFromDB = async (storeName, key) => {
  try {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error("IndexedDB Read Error:", err);
    return null;
  }
};
