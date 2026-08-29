export const HardwareManager = {
    audioCtx: null,
    wakeLock: null,

    init() {
        this.setupAudio();
        this.setupWakeLock();
    },

    setupAudio() {
        const initAudio = () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            document.removeEventListener('pointerdown', initAudio);
            document.removeEventListener('click', initAudio);
        };
        // İlk etkileşimde AudioContext başlat/resume et
        document.addEventListener('pointerdown', initAudio, { once: true });
        document.addEventListener('click', initAudio, { once: true });
    },

    playChime() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 notası
        
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    },

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
            }
        }
    },

    setupWakeLock() {
        this.requestWakeLock();
        // Sekme tekrar öne geldiğinde kilit düşmüşse yeniden iste
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.wakeLock !== null) {
                this.requestWakeLock();
            }
        });
    },

    triggerVibration(element) {
        if (navigator.vibrate) {
            // Destekleyen cihazlarda fiziksel titreşim
            navigator.vibrate(150);
        } else if (element) {
            // iOS Safari gibi desteklemeyenlerde görsel parlama (fallback)
            element.classList.remove('haptic-pulse');
            // DOM güncellemesini zorlamak için ufak bir hile (reflow)
            void element.offsetWidth;
            element.classList.add('haptic-pulse');
        }
    }
};
