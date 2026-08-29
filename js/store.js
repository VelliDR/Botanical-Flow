import { AccrualEngine } from './accrual.js';

export const STATUS = {
    IDLE: 'IDLE',
    WORKING: 'WORKING',
    BREAK: 'BREAK'
};

export const MODE = {
    KIWI: 'kiwi',
    STRAWBERRY: 'strawberry'
};

class Store {
    constructor() {
        this.state = {
            status: STATUS.IDLE,
            mode: MODE.KIWI,
            breakCredit: 0, // In seconds
            workTime: 0, // In seconds for current session
        };
        this.listeners = [];
        this.lastTimestamp = null;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        // Initial notification
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(l => l(this.state));
    }

    dispatch(action, payload) {
        const now = Date.now();
        
        switch (action) {
            case 'START_WORK':
                if (this.state.status !== STATUS.WORKING) {
                    this.state.status = STATUS.WORKING;
                    this.lastTimestamp = now;
                    this.state.workTime = 0; // Reset work time for the new session, credit remains
                }
                break;
                
            case 'START_BREAK':
                if (this.state.status !== STATUS.BREAK && this.state.breakCredit >= AccrualEngine.MIN_BREAK_THRESHOLD) {
                    this.state.status = STATUS.BREAK;
                    this.lastTimestamp = now;
                    this.state.workTime = 0; // Work time is not relevant during break
                }
                break;
                
            case 'STOP':
                this.state.status = STATUS.IDLE;
                this.lastTimestamp = null;
                break;
                
            case 'SET_MODE':
                this.state.mode = payload;
                break;
                
            case 'TICK':
                this.handleTick(now);
                break;
        }
        this.notify();
    }

    handleTick(now) {
        if (this.state.status === STATUS.IDLE || !this.lastTimestamp) return;

        const deltaSec = (now - this.lastTimestamp) / 1000;
        this.lastTimestamp = now;

        if (this.state.status === STATUS.WORKING) {
            this.state.workTime += deltaSec;
            const newCredit = AccrualEngine.calculateCredit(this.state.mode, deltaSec);
            this.state.breakCredit = Math.min(this.state.breakCredit + newCredit, AccrualEngine.MAX_CREDIT);
        } else if (this.state.status === STATUS.BREAK) {
            this.state.breakCredit -= deltaSec;
            // Overbreak is naturally handled by breakCredit becoming negative.
        }
    }
}

export const store = new Store();
