const dbName = 'FarmInspectionDB';
const dbVersion = 2;

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
      if (!db.objectStoreNames.contains('sites')) {
        db.createObjectStore('sites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
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

export const getAllFromDB = async (storeName) => {
  try {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = (event) => resolve(event.target.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error("IndexedDB Read All Error:", err);
    return [];
  }
};

export const deleteFromDB = async (storeName, key) => {
  try {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error("IndexedDB Delete Error:", err);
  }
};

export const generateId = () => {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
};

export const getSites = async () => {
  return await getAllFromDB('sites');
};

export const addSite = async (site) => {
  const newSite = { ...site, id: generateId(), createdAt: new Date().toISOString() };
  await saveToDB('sites', newSite.id, newSite);
  return newSite;
};

export const updateSite = async (id, updates) => {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('sites', 'readwrite');
    const store = transaction.objectStore('sites');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Site not found')); return; }
      const updated = { ...existing, ...updates, id };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = (e) => reject(e.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
};

export const deleteSite = async (id) => {
  await deleteFromDB('sites', id);
};

export const getTemplates = async () => {
  return await getAllFromDB('templates');
};

export const addTemplate = async (template) => {
  const newTemplate = { ...template, id: generateId(), createdAt: new Date().toISOString() };
  await saveToDB('templates', newTemplate.id, newTemplate);
  return newTemplate;
};

export const updateTemplate = async (id, updates) => {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('templates', 'readwrite');
    const store = transaction.objectStore('templates');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Template not found')); return; }
      const updated = { ...existing, ...updates, id };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = (e) => reject(e.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
};

export const deleteTemplate = async (id) => {
  await deleteFromDB('templates', id);
};
