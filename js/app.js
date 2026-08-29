import { store, STATUS, MODE } from './store.js';
import { AccrualEngine } from './accrual.js';
import { HardwareManager } from './hardware.js';
import { StorageManager } from './storage.js';
import { BadgeEngine, BADGES } from './badges.js';

// DOM Elements
const el = {
    btnWork: document.getElementById('btn-work'),
    btnBreak: document.getElementById('btn-break'),
    btnStop: document.getElementById('btn-stop'),
    modeInputs: document.querySelectorAll('input[name="mode"]'),
    timeDisplay: document.getElementById('time-display'),
    creditDisplay: document.getElementById('credit-display'),
    seedContainer: document.getElementById('seed-container'),
    
    // Backup UI
    backupReminder: document.getElementById('backup-reminder'),
    lastBackupDate: document.getElementById('last-backup-date'),
    btnExport: document.getElementById('btn-export'),
    btnCloseBackup: document.getElementById('btn-close-backup'),
    
    // FAZ 3: Showcase & Ambient
    btnShowcase: document.getElementById('btn-showcase'),
    badgeShowcase: document.getElementById('badge-showcase'),
    badgeList: document.getElementById('badge-list'),
    btnCloseShowcase: document.getElementById('btn-close-showcase'),
    badgeNotification: document.getElementById('badge-notification'),
    newBadgesContainer: document.getElementById('new-badges-container'),
    ambientHud: document.getElementById('ambient-hud'),
    ambientTime: document.getElementById('ambient-time'),
    ambientStatus: document.getElementById('ambient-status'),
    mainCard: document.querySelector('.glass-card'),
    
    // UI Images
    uiModeIcon: document.getElementById('ui-mode-icon'),
    ambientModeIcon: document.getElementById('ambient-mode-icon')
};

// Start Hardware Subsystem
HardwareManager.init();

// Tick orchestrator (1 Hz)
setInterval(() => {
    store.dispatch('TICK');
}, 1000);

// Helper to format seconds to [M]M:SS or [H]H:MM:SS
function formatTime(seconds) {
    const isNegative = seconds < 0;
    const absSec = Math.floor(Math.abs(seconds));
    
    const h = Math.floor(absSec / 3600);
    const m = Math.floor((absSec % 3600) / 60);
    const s = absSec % 60;
    
    const mm = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');
    const hh = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
    
    const formatted = `${hh}${mm}:${ss}`;
    return isNegative ? `-${formatted}` : formatted;
}

// FAZ 3: State trackers
let lastStatus = STATUS.IDLE;
let returnedOnTime = false;
let ambientMode = false;

// Double click for Ambient HUD
document.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label') || e.target.closest('.showcase-modal')) return;
    
    ambientMode = !ambientMode;
    HardwareManager.triggerVibration();
    
    if (ambientMode) {
        el.ambientHud.style.display = 'flex';
        el.mainCard.style.opacity = '0';
        el.mainCard.style.pointerEvents = 'none';
        el.btnShowcase.style.display = 'none';
        
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            }
        } catch (e) {}
        
    } else {
        el.ambientHud.style.display = 'none';
        el.mainCard.style.opacity = '1';
        el.mainCard.style.pointerEvents = 'auto';
        el.btnShowcase.style.display = 'block';
        
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } catch (e) {}
    }
    // Zorunlu UI güncellemesi tetikle
    store.notify();
});

// Render Badge Showcase and Heatmap
async function renderShowcase() {
    const unlocked = JSON.parse(localStorage.getItem('bf_badges') || '[]');
    el.badgeList.innerHTML = '';
    
    Object.values(BADGES).forEach(badge => {
        const isUnlocked = unlocked.includes(badge.id);
        const div = document.createElement('div');
        div.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        div.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        `;
        el.badgeList.appendChild(div);
    });

    // FAZ 5: Heatmap Rendering
    const heatmapGrid = document.getElementById('heatmap-grid');
    if (heatmapGrid) {
        heatmapGrid.innerHTML = '';
        const allSessions = await StorageManager.getAllSessions();
        
        // Takvim dizisi (son 30 gün)
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const dayMap = {};
        allSessions.forEach(s => {
            const d = new Date(s.timestamp);
            d.setHours(0,0,0,0);
            const ts = d.getTime();
            dayMap[ts] = (dayMap[ts] || 0) + s.duration;
        });

        // 30 günü oluştur
        for (let i = 29; i >= 0; i--) {
            const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const ts = day.getTime();
            const duration = dayMap[ts] || 0;
            
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            const dk = Math.floor(duration / 60);
            cell.title = `${day.toLocaleDateString('tr-TR')}: ${dk} dk`;
            
            let intensity = 0;
            if (duration > 0 && duration <= 60 * 60) intensity = 1;
            else if (duration > 60 * 60 && duration <= 2 * 3600) intensity = 2;
            else if (duration > 2 * 3600) intensity = 3;
            
            cell.setAttribute('data-intensity', intensity);
            heatmapGrid.appendChild(cell);
        }
    }
}
renderShowcase();

// Bindings to Reaktif Store

store.subscribe((state) => {
    // FAZ 3 & 5: Check return on time and track stats
    if (lastStatus === STATUS.BREAK && state.status !== STATUS.BREAK) {
        returnedOnTime = state.breakCredit >= 0;
        
        if (state.status === STATUS.WORKING) {
            let stats = JSON.parse(localStorage.getItem('bf_stats') || '{"perfectCycles": 0, "earlyReturns": 0}');
            if (state.breakCredit > 0) {
                stats.earlyReturns += 1;
            }
            if (returnedOnTime) {
                stats.perfectCycles += 1;
            } else {
                stats.perfectCycles = 0; // Streak broken
            }
            localStorage.setItem('bf_stats', JSON.stringify(stats));
        }
    }

    // Session completion trigger (e.g., transition from WORKING/BREAK -> IDLE)
    if (lastStatus !== STATUS.IDLE && state.status === STATUS.IDLE) {
        HardwareManager.playChime();
        el.lastBackupDate.textContent = StorageManager.getLastBackupDateStr();
        el.backupReminder.style.display = 'flex';
        
        const sessionData = {
            mode: state.mode,
            duration: state.workTime, 
            earnedCredit: state.breakCredit,
            timestamp: Date.now(),
            returnedOnTime: returnedOnTime
        };
        
        // Veritabanına kaydet ve Kanonik Rozetleri değerlendir
        StorageManager.saveSession(sessionData)
            .then(async () => {
                const allSessions = await StorageManager.getAllSessions();
                const newlyUnlocked = BadgeEngine.evaluateSession(sessionData, allSessions);
                const previouslyUnlocked = JSON.parse(localStorage.getItem('bf_badges') || '[]');
                
                let newBadges = [];
                newlyUnlocked.forEach(bId => {
                    if (!previouslyUnlocked.includes(bId)) {
                        previouslyUnlocked.push(bId);
                        newBadges.push(bId);
                    }
                });

                if (newBadges.length > 0) {
                    localStorage.setItem('bf_badges', JSON.stringify(previouslyUnlocked));
                    
                    // Bildirim UI
                    el.newBadgesContainer.innerHTML = newBadges.map(id => `
                        <div style="text-align:center;">
                            <div style="font-size:2rem;">${BADGES[id].icon}</div>
                            <div style="font-size:0.8rem; color:#fff;">${BADGES[id].name}</div>
                        </div>
                    `).join('');
                    
                    el.badgeNotification.style.display = 'block';
                    HardwareManager.triggerVibration();
                    setTimeout(() => el.badgeNotification.style.display = 'none', 5000);
                    
                    renderShowcase();
                }
            })
            .catch(console.error);
    }
    lastStatus = state.status;

    // Ambient UI Update
    if (ambientMode) {
        const timeToDisplay = state.status === STATUS.WORKING ? state.workTime : state.breakCredit;
        el.ambientTime.textContent = formatTime(timeToDisplay);
        const modeText = state.mode === 'kiwi' ? '🥝 Kivi' : '🍓 Çilek';
        el.ambientStatus.textContent = `${modeText} • ${state.status}`;
    }

    // 1. Theme update
    document.body.className = state.mode;
    
    // Update Mode Images
    const modeImage = state.mode === 'kiwi' ? 'kiwi.png' : 'strawberry.png';
    el.uiModeIcon.src = modeImage;
    el.ambientModeIcon.src = modeImage;
    
    // Sync UI radio buttons (in case of programmatic change)
    el.modeInputs.forEach(input => {
        if (input.value === state.mode) {
            input.checked = true;
        }
    });

    // 2. Main displays
    if (state.status === STATUS.IDLE) {
        el.timeDisplay.textContent = '00:00';
    } else if (state.status === STATUS.WORKING) {
        el.timeDisplay.textContent = formatTime(state.workTime);
    } else if (state.status === STATUS.BREAK) {
        el.timeDisplay.textContent = 'MOLA';
    }

    el.creditDisplay.textContent = `Kredi: ${formatTime(state.breakCredit)}`;
    
    // Add debt styling if break credit is negative (Overbreak)
    if (state.breakCredit < 0) {
        el.creditDisplay.classList.add('debt');
    } else {
        el.creditDisplay.classList.remove('debt');
    }

    // 3. Seed Capsule Fill Level (Performance friendly CSS transition)
    const fillPercent = Math.max(0, Math.min(100, (state.breakCredit / AccrualEngine.MAX_CREDIT) * 100));
    el.seedContainer.style.setProperty('--fill-percent', `${fillPercent}%`);

    // 4. Button Visibility & State
    const canBreak = state.breakCredit >= AccrualEngine.MIN_BREAK_THRESHOLD;
    
    if (state.status === STATUS.WORKING) {
        el.btnWork.style.display = 'none';
        el.btnBreak.style.display = 'block';
        el.btnStop.style.display = 'block';
        
        el.btnBreak.disabled = !canBreak;
        el.btnBreak.textContent = canBreak ? 'Mola Ver' : 'Kredi Bekleniyor...';
    } else if (state.status === STATUS.BREAK) {
        el.btnWork.style.display = 'block';
        el.btnBreak.style.display = 'none';
        el.btnStop.style.display = 'block';
        
        el.btnWork.textContent = 'Çalışmaya Dön';
    } else {
        // IDLE
        el.btnWork.style.display = 'block';
        el.btnBreak.style.display = 'none';
        el.btnStop.style.display = 'none';
        
        el.btnWork.textContent = 'Çalışmaya Başla';
    }
});

// Event Listeners with Haptic Feedback
function handleBtnClick(btn, action) {
    HardwareManager.triggerVibration(btn);
    HardwareManager.playChime(); // Opsiyonel, sese de bağlayabiliriz
    store.dispatch(action);
}

el.btnWork.addEventListener('click', () => handleBtnClick(el.btnWork, 'START_WORK'));
el.btnBreak.addEventListener('click', () => handleBtnClick(el.btnBreak, 'START_BREAK'));
el.btnStop.addEventListener('click', () => handleBtnClick(el.btnStop, 'STOP'));

el.modeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        HardwareManager.triggerVibration(e.target.parentElement);
        store.dispatch('SET_MODE', e.target.value);
    });
});

// Backup UI Handlers
el.btnExport.addEventListener('click', () => {
    HardwareManager.triggerVibration(el.btnExport);
    StorageManager.exportData();
    el.lastBackupDate.textContent = StorageManager.getLastBackupDateStr();
});

el.btnCloseBackup.addEventListener('click', () => {
    HardwareManager.triggerVibration(el.btnCloseBackup);
    el.backupReminder.style.display = 'none';
});

// Showcase UI Handlers
el.btnShowcase.addEventListener('click', () => {
    HardwareManager.triggerVibration(el.btnShowcase);
    el.badgeShowcase.style.display = 'flex';
});

el.btnCloseShowcase.addEventListener('click', () => {
    HardwareManager.triggerVibration(el.btnCloseShowcase);
    el.badgeShowcase.style.display = 'none';
});

// FAZ 4: Service Worker Registration (PWA & Offline)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully.', reg))
            .catch(err => console.error('Service Worker registration failed.', err));
    });
}
