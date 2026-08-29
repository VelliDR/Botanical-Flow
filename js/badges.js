export const BADGES = {
    seed_sprout: { id: 'seed_sprout', name: 'İlk Filiz', description: 'İlk 30 dk kesintisiz seans', icon: '🌱' },
    battery_full: { id: 'battery_full', name: 'Tam Şarj', description: '75 dk mola tavanına ulaşma', icon: '🔋' },
    early_dew: { id: 'early_dew', name: 'Erken Çiy', description: '06:00 - 08:00 arası tamamlanan seans', icon: '💧' },
    night_watch: { id: 'night_watch', name: 'Gece Nöbeti', description: '23:00 sonrası 60 dk çalışma', icon: '🦉' },
    silent_harvest: { id: 'silent_harvest', name: 'Sessiz Hasat', description: 'Tek bir günde toplam 4 saat odak', icon: '🌾' },
    deep_roots: { id: 'deep_roots', name: 'Kök Salma', description: '5 gün üst üste en az 1 seans', icon: '🌳' },
    on_time: { id: 'on_time', name: 'Dakik', description: 'Molayı borca girmeden tam vaktinde bitirme', icon: '⏱️' },
    strawberry_master: { id: 'strawberry_master', name: 'Çilek Sezonu', description: 'Çilek modunda 10 saat tamamlama', icon: '🍓' },
    weekend_gardener: { id: 'weekend_gardener', name: 'Hafta Sonu Bahçıvanı', description: 'Hafta sonu 2 saatlik odak', icon: '🏡' },
    perfect_cycle: { id: 'perfect_cycle', name: 'Mükemmel Döngü', description: '3 kez art arda zamanında çalışma', icon: '🔄' },
    perfect_week: { id: 'perfect_week', name: 'Takvim Ağacı', description: '7 gün boyunca kesintisiz her gün 1 seans', icon: '🗓️' },
    zen_master: { id: 'zen_master', name: 'Zen Ustası', description: '5 kez molayı erken bitirip çalışmaya dönme', icon: '🧘' }
};

export class BadgeEngine {
    /**
     * @param {Object} session - { mode, duration, earnedCredit, timestamp, returnedOnTime }
     * @param {Array} allSessions - History of all past sessions
     * @returns {Array<string>} List of unlocked badge IDs
     */
    static evaluateSession(session, allSessions) {
        const unlockedBadges = [];
        const sessionDate = new Date(session.timestamp);
        const startHour = new Date(session.timestamp - session.duration * 1000).getHours();
        
        // 1. seed_sprout (İlk Filiz) - İlk 30 dk kesintisiz seans
        if (session.duration >= 30 * 60) {
            unlockedBadges.push(BADGES.seed_sprout.id);
        }
        
        // 2. battery_full (Tam Şarj) - 75 dk mola tavanına ulaşma (4500 sn)
        if (session.earnedCredit >= 4500) {
            unlockedBadges.push(BADGES.battery_full.id);
        }
        
        // 3. early_dew (Erken Çiy) - 06:00 - 08:00 arası tamamlanan seans
        if (startHour >= 6 && startHour < 8) {
            unlockedBadges.push(BADGES.early_dew.id);
        }
        
        // 4. night_watch (Gece Nöbeti) - 23:00 sonrası 60 dk çalışma
        if (startHour >= 23 && session.duration >= 60 * 60) {
            unlockedBadges.push(BADGES.night_watch.id);
        }
        
        // 5. silent_harvest (Sessiz Hasat) - Tek bir günde toplam 4 saat odak
        const todayStr = sessionDate.toDateString();
        const todaySessions = allSessions.filter(s => new Date(s.timestamp).toDateString() === todayStr);
        const todayDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0) + session.duration;
        if (todayDuration >= 4 * 3600) {
            unlockedBadges.push(BADGES.silent_harvest.id);
        }
        
        // 6. deep_roots (Kök Salma) - 5 gün üst üste en az 1 seans
        const uniqueDays = [...new Set([...allSessions.map(s => new Date(s.timestamp).toDateString()), todayStr])];
        uniqueDays.sort((a, b) => new Date(a) - new Date(b));
        
        let consecutiveCount = 1;
        if (uniqueDays.length >= 2) {
            let lastDate = new Date(uniqueDays[uniqueDays.length - 1]);
            for (let i = uniqueDays.length - 2; i >= 0; i--) {
                const current = new Date(uniqueDays[i]);
                const diffTime = Math.abs(lastDate - current);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                    consecutiveCount++;
                    lastDate = current;
                } else if (diffDays > 1) {
                    break;
                }
            }
        }
        if (consecutiveCount >= 5) {
            unlockedBadges.push(BADGES.deep_roots.id);
        }

        // 7. on_time (Dakik) - Molayı borca girmeden tam vaktinde bitirme
        if (session.returnedOnTime) {
            unlockedBadges.push(BADGES.on_time.id);
        }

        // 8. strawberry_master (Çilek Sezonu) - Çilek modunda 10 saat tamamlama
        const strawberrySessions = allSessions.filter(s => s.mode === 'strawberry');
        const strawberryDuration = strawberrySessions.reduce((acc, s) => acc + s.duration, 0) + (session.mode === 'strawberry' ? session.duration : 0);
        if (strawberryDuration >= 10 * 3600) {
            unlockedBadges.push(BADGES.strawberry_master.id);
        }

        // 9. weekend_gardener (Hafta Sonu Bahçıvanı) - Hafta sonu 2 saat
        if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) {
            const weekendSessions = allSessions.filter(s => new Date(s.timestamp).toDateString() === todayStr);
            const weekendDuration = weekendSessions.reduce((acc, s) => acc + s.duration, 0) + session.duration;
            if (weekendDuration >= 2 * 3600) {
                unlockedBadges.push(BADGES.weekend_gardener.id);
            }
        }

        // 10. perfect_week (Takvim Ağacı) - 7 gün üst üste en az 1 seans
        if (consecutiveCount >= 7) {
            unlockedBadges.push(BADGES.perfect_week.id);
        }

        // 11. perfect_cycle (Mükemmel Döngü) - app.js üzerinden takip ediliyor (bf_stats)
        const stats = JSON.parse(localStorage.getItem('bf_stats') || '{"perfectCycles": 0, "earlyReturns": 0}');
        if (stats.perfectCycles >= 3) {
            unlockedBadges.push(BADGES.perfect_cycle.id);
        }

        // 12. zen_master (Zen Ustası) - app.js üzerinden takip ediliyor
        if (stats.earlyReturns >= 5) {
            unlockedBadges.push(BADGES.zen_master.id);
        }

        return unlockedBadges;
    }
}
