export class AccrualEngine {
    static get RATES() {
        return {
            kiwi: 1 / 3, // 3 seconds work = 1 second break
            strawberry: 1 / 2 // 2 seconds work = 1 second break
        };
    }

    static get MAX_CREDIT() {
        return 75 * 60; // 4500 seconds (75 minutes)
    }

    static get MIN_BREAK_THRESHOLD() {
        return 10 * 60; // 600 seconds (10 minutes)
    }

    /**
     * Calculates the amount of break credit earned for a given work duration.
     * @param {string} mode - 'kiwi' or 'strawberry'
     * @param {number} workDeltaSec - Elapsed work time in seconds
     * @returns {number} Earned break credit in seconds
     */
    static calculateCredit(mode, workDeltaSec) {
        const rate = this.RATES[mode] || this.RATES.kiwi;
        return workDeltaSec * rate;
    }
}
