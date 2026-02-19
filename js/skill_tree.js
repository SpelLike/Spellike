// ==========================================
// ARCANE DEPTHS – Skill Tree Logic (v1.0)
// ==========================================
// Handles: purchase validation, persistence, modifier aggregation.
// Does NOT touch DOM.
//
// Persistence key: 'arcane_depths_skilltree_v1'
// Saved fields:
//   owned    – Set<string> of node IDs purchased
//   blocked  – Set<string> of node IDs blocked by exclusivity choices
//   version  – string (tree schema version, for future migrations)
// ==========================================

(function () {
    const SAVE_KEY = 'arcane_depths_skilltree_v1';

    // New progression mode (requested):
    // - Buy ALL nodes (no prereq/excl restrictions)
    // - Only buy nodes from the CURRENT visual tier
    // - Next tier unlocks once you complete (buy ALL) nodes in the current tier
    // - 14 visual tiers per category (0..13)
    const TOTAL_VISUAL_TIERS = 14;

    const SkillTree = {
        owned: new Set(),     // purchased node IDs
        blocked: new Set(),   // kept for backwards-compat; ignored in new rules
        _listeners: [],       // change listeners

        _vtMap: { combat: null, passive: null },   // id -> visualTier
        _vtLists: { combat: null, passive: null }, // visualTier -> [ids]

        // ── INIT ──────────────────────────────────────────────────────────
        init() {
            this.load();
        },

        // ── VISUAL TIERS (0..13) ─────────────────────────────────────────
        _ensureVisualTiers(cat) {
            if (this._vtMap[cat] && this._vtLists[cat]) return;

            const nodes = SkillTreeData.byCategory(cat) || [];
            const root = nodes.filter(n => n.tier === 0);
            const t1 = nodes.filter(n => n.tier === 1)
                .sort((a, b) => (a.x - b.x) || a.id.localeCompare(b.id));
            const rest = nodes.filter(n => n.tier >= 2)
                .sort((a, b) => (a.tier - b.tier) || (a.x - b.x) || a.id.localeCompare(b.id));

            const tiers = Array.from({ length: TOTAL_VISUAL_TIERS }, () => []);

            if (root.length) tiers[0].push(root[0].id);
            for (const n of t1) tiers[1].push(n.id);

            const remainingTierCount = TOTAL_VISUAL_TIERS - 2;
            const N = rest.length;
            for (let i = 0; i < N; i++) {
                // Even distribution across tiers 2..13
                const slot = remainingTierCount <= 1 ? 0 : Math.floor(i * remainingTierCount / N);
                const vt = 2 + slot;
                tiers[vt].push(rest[i].id);
            }

            const map = {};
            for (let vt = 0; vt < tiers.length; vt++) {
                for (const id of tiers[vt]) map[id] = vt;
            }

            this._vtMap[cat] = map;
            this._vtLists[cat] = tiers;
        },

        getVisualTier(id) {
            const node = SkillTreeData.getNode(id);
            if (!node) return 0;
            const cat = node.category;
            this._ensureVisualTiers(cat);
            return this._vtMap[cat][id] ?? 0;
        },

        getTierIds(cat, vt) {
            this._ensureVisualTiers(cat);
            return (this._vtLists[cat] && this._vtLists[cat][vt]) ? this._vtLists[cat][vt] : [];
        },

        // Current unlocked tier is the first tier that is NOT fully owned.
        getUnlockedTier(cat) {
            this._ensureVisualTiers(cat);
            const tiers = this._vtLists[cat] || [];
            for (let vt = 0; vt < tiers.length; vt++) {
                const ids = tiers[vt];
                if (!ids || ids.length === 0) continue;
                const allOwned = ids.every(id => this.isOwned(id));
                if (!allOwned) return vt;
            }
            return TOTAL_VISUAL_TIERS - 1;
        },

        // ── PERSISTENCE ───────────────────────────────────────────────────
        save() {
            try {
                const data = {
                    version: SkillTreeData.version,
                    owned: Array.from(this.owned),
                    blocked: Array.from(this.blocked),
                };
                localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            } catch (e) { console.warn('[SkillTree] save error:', e); }
        },

        load() {
            try {
                const raw = localStorage.getItem(SAVE_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    this.owned = new Set(data.owned || []);
                    this.blocked = new Set(data.blocked || []);
                    // Future migrations based on data.version
                } else {
                    this.owned = new Set();
                    this.blocked = new Set();
                }
            } catch (e) {
                this.owned = new Set();
                this.blocked = new Set();
            }
        },

        // ── QUERY ─────────────────────────────────────────────────────────
        isOwned(id) { return this.owned.has(id); },
        isBlocked(id) { return this.blocked.has(id); },

        // New unlock rule: only nodes in the currently unlocked VISUAL tier are purchasable.
        canUnlock(id) {
            const node = SkillTreeData.getNode(id);
            if (!node) return false;
            if (this.isOwned(id)) return false;
            const vt = this.getVisualTier(id);
            const unlocked = this.getUnlockedTier(node.category);
            return vt === unlocked;
        },

        // Node state: 'owned' | 'available' | 'locked' | 'blocked'
        getState(id) {
            if (this.isOwned(id)) return 'owned';
            if (this.canUnlock(id)) return 'available';
            return 'locked';
        },

        // ── PURCHASE ──────────────────────────────────────────────────────
        buy(id) {
            const node = SkillTreeData.getNode(id);
            if (!node) return { ok: false, reason: 'notFound' };
            if (!this.canUnlock(id)) return { ok: false, reason: 'prereq' };

            const cost = SkillTreeData.getCost(node);
            const essence = window.Meta ? Meta.getEssence() : 0;
            if (essence < cost) return { ok: false, reason: 'funds', cost, essence };

            // Deduct essence
            if (window.Meta) Meta.data.essence = essence - cost;
            if (window.Meta) Meta.save();

            // Mark owned
            this.owned.add(id);

            // No exclusions in this mode.

            this.save();
            this._notify(id);
            return { ok: true };
        },

        // ── RESET ─────────────────────────────────────────────────────────
        // Refund all spent essence and clear the tree
        reset() {
            const refund = this._totalSpent();
            if (window.Meta) {
                Meta.data.essence = (Meta.getEssence() || 0) + refund;
                Meta.save();
            }
            this.owned.clear();
            this.blocked.clear();
            this.save();
            this._notify('__reset__');
        },

        _totalSpent() {
            let total = 0;
            for (const id of this.owned) {
                const node = SkillTreeData.getNode(id);
                if (node) total += SkillTreeData.getCost(node);
            }
            return total;
        },

        // ── MODIFIERS ─────────────────────────────────────────────────────
        // Returns aggregate modifier object for owned nodes.
        // All values are additive (pct fields are summed, then applied multiplicatively to base stats).
        getModifiers() {
            const mods = {
                damagePct: 0,
                fireRatePct: 0,         // negative = faster
                projSpeedPct: 0,
                projRangePct: 0,
                moveSpeedPct: 0,
                speedPct: 0,            // alias for moveSpeedPct
                critChancePct: 0,
                critDmgPct: 0,
                critDamagePct: 0,       // alias for critDmgPct
                chainHitPct: 0,
                doubleShotChancePct: 0,
                manaCostPct: 0,         // negative = cheaper
                maxManaFlat: 0,
                manaRegenPct: 0,        // mana regen bonus
                maxHpFlat: 0,
                hpRegenPerSec: 0,
                dmgReductionPct: 0,
                lifeStealPct: 0,
                reflectDmgPct: 0,
                luckPct: 0,
                goldPct: 0,
                startGoldFlat: 0,
                startPotionsFlat: 0,
                shopSlotsBonus: 0,
                shopRerollsBonus: 0,
                dashChargesBonus: 0,
                dashCooldownPct: 0,
                phoenixPassive: false,
            };

            for (const id of this.owned) {
                const node = SkillTreeData.getNode(id);
                if (!node || !node.effects) continue;
                for (const [key, val] of Object.entries(node.effects)) {
                    if (key === 'phoenixPassive') { if (val) mods.phoenixPassive = true; }
                    else if (typeof mods[key] === 'number') { mods[key] += val; }
                }
            }

            // Apply caps to avoid breaking the game
            mods.damagePct = Math.min(mods.damagePct, 0.40);         // max +40% dmg
            mods.fireRatePct = Math.max(mods.fireRatePct, -0.35);    // max 35% faster fire
            mods.critChancePct = Math.min(mods.critChancePct, 0.25); // max 25% crit
            mods.dmgReductionPct = Math.min(mods.dmgReductionPct, 0.30); // max 30% reduction
            mods.lifeStealPct = Math.min(mods.lifeStealPct, 0.04);   // max 4% lifesteal
            mods.luckPct = Math.min(mods.luckPct, 0.30);             // max 30% luck
            mods.goldPct = Math.min(mods.goldPct, 0.50);             // max 50% extra gold
            mods.moveSpeedPct = Math.min(mods.moveSpeedPct, 0.25);   // max 25% move speed

            // Merge aliases
            mods.moveSpeedPct += mods.speedPct; // speedPct → moveSpeedPct
            mods.critDmgPct += mods.critDamagePct; // critDamagePct → critDmgPct
            mods.moveSpeedPct = Math.min(mods.moveSpeedPct, 0.40);   // combined cap
            mods.critDmgPct = Math.min(mods.critDmgPct, 1.0);        // max +100% crit dmg
            mods.manaRegenPct = Math.min(mods.manaRegenPct, 0.50);   // max +50% mana regen

            return mods;
        },

        // Convenience shims used by Meta API
        getDashChargesBonus() { return Math.floor(this.getModifiers().dashChargesBonus); },
        getLuckBonus()        { return this.getModifiers().luckPct; },
        getMaxHpBonus()       { return Math.floor(this.getModifiers().maxHpFlat); },
        getStartGoldBonus()   { return Math.floor(this.getModifiers().startGoldFlat); },
        getStartPotionsBonus(){ return Math.floor(this.getModifiers().startPotionsFlat); },
        getShopSlotsBonus()   { return Math.floor(this.getModifiers().shopSlotsBonus); },
        getShopRerollsBonus() { return Math.floor(this.getModifiers().shopRerollsBonus); },

        // ── CHANGE LISTENERS ──────────────────────────────────────────────
        onChange(fn) { this._listeners.push(fn); },
        _notify(id) {
            for (const fn of this._listeners) {
                try { fn(id); } catch (e) { /* ignore */ }
            }
        },

        // ── STATS HELPERS (for UI display) ────────────────────────────────
        totalOwned()   { return this.owned.size; },
        totalSpent()   { return this._totalSpent(); },
        ownedByCategory(cat) {
            return [...this.owned].filter(id => {
                const n = SkillTreeData.getNode(id);
                return n && n.category === cat;
            }).length;
        },
    };

    window.SkillTree = SkillTree;
})();
