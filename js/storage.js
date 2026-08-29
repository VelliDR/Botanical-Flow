const DB_NAME = 'botanical_flow_db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export const StorageManager = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (e) => reject(e.target.error);

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    },

    async saveSession(sessionData) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            // Session datasını kaydet
            const request = store.add({ ...sessionData, timestamp: Date.now() });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllSessions() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async exportData() {
        const sessions = await this.getAllSessions();
        const dataStr = JSON.stringify(sessions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `botanical_flow_backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // ITP kalkanına karşı yedekleme tarihini sakla
        localStorage.setItem('bf_last_backup', Date.now());
    },
    
    getLastBackupDateStr() {
        const ts = localStorage.getItem('bf_last_backup');
        if (!ts) return 'Hiç yedeklenmedi';
        return new Date(parseInt(ts, 10)).toLocaleString('tr-TR');
    }
};
