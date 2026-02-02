// ==========================================
// ARCANE DEPTHS - Audio System (SFX + Custom Music)
// ==========================================

const AudioManager = {
    context: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    uiGain: null,

    // Music via HTMLAudioElement routed through WebAudio (respects sliders)
    musicEl: null,
    musicSource: null,
    musicPlaying: false,
    musicState: 'menu',        // 'menu' | 'party' | 'boss'
    desiredMusicState: 'menu',
    biomeForProcedural: 'forest',
    unlocked: false,

    // Custom tracks (user-provided). Keep both MP3 and M4A for maximum browser support.
    tracks: {
        menu:  { mp3: 'assets/music/Menu.mp3',  m4a: 'assets/music/Menu.m4a' },
        party: { mp3: 'assets/music/Party.mp3', m4a: 'assets/music/Party.m4a' },
        boss:  { mp3: 'assets/music/Boss.mp3',  m4a: 'assets/music/Boss.m4a' },
    },

    sounds: {},

    init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();

        this.masterGain = this.context.createGain();
        this.musicGain  = this.context.createGain();
        this.sfxGain    = this.context.createGain();
        this.uiGain     = this.context.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.uiGain.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);

        // Music element (will only play after a user gesture)
        this.musicEl = new Audio();
        this.musicEl.loop = true;
        this.musicEl.preload = 'auto';

        try {
            // Route music through WebAudio so sliders work
            this.musicSource = this.context.createMediaElementSource(this.musicEl);
            this.musicSource.connect(this.musicGain);
        } catch (e) {
            // If MediaElementSource fails (rare), fallback to element volume control
            this.musicSource = null;
        }

        this.loadSettings();
        this.generateSounds();

        // Prime desired state (actual playback will start on first user gesture)
        this.desiredMusicState = 'menu';
        this.musicState = 'menu';
    },

    // Call on any click/keydown/mousedown; unlocks audio + starts desired music
    userGesture() {
        if (!this.context) return;
        if (!this.unlocked) this.unlocked = true;

        if (this.context.state === 'suspended') {
            try { this.context.resume(); } catch (e) {}
        }

        this.applyMusicState();
    },

    loadSettings() {
        const settings = SaveManager.getSettings();
        this.setMasterVolume(settings.audio.master / 100);
        this.setMusicVolume(settings.audio.music / 100);
        this.setSfxVolume(settings.audio.sfx / 100);
        this.setUiVolume(settings.audio.ui / 100);
    },

    setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.value = v; },
    setMusicVolume(v)  { if (this.musicGain)  this.musicGain.gain.value  = v; },
    setSfxVolume(v)    { if (this.sfxGain)    this.sfxGain.gain.value    = v; },
    setUiVolume(v)     { if (this.uiGain)     this.uiGain.gain.value     = v; },

    generateSounds() {
        this.sounds = {
            shoot: () => this.createShoot(),
            hit: () => this.createHit(),
            explosion: () => this.createExplosion(),
            pickup: () => this.createPickup(),
            dash: () => this.createDash(),
            hurt: () => this.createHurt(),
            death: () => this.createDeath(),
            menuClick: () => this.createClick(),
            menuHover: () => this.createHover(),
            chest: () => this.createChest(),
            door: () => this.createDoor(),
        };
    },

    play(name, volume = 1) {
        if (!this.context) return;
        if (this.context.state === 'suspended') {
            try { this.context.resume(); } catch (e) {}
        }
        if (this.sounds[name]) this.sounds[name](volume);
    },

    // ========================
    // MUSIC SYSTEM (CUSTOM)
    // ========================

    // Old signature kept for compatibility: called by Game.start(biome)
    startMusic(biome = 'forest') {
        this.biomeForProcedural = biome;
        this.setMusicState('party');
    },

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicEl) {
            try { this.musicEl.pause(); } catch (e) {}
        }
    },

    setMusicState(state /* menu|party|boss */) {
        if (!state) return;
        this.desiredMusicState = state;
        this.applyMusicState();
    },

    // Pick the best track variant for this browser.
    // Returns a string URL or null.
    getTrackSrc(state) {
        if (!this.musicEl) return null;
        const entry = this.tracks[state];
        if (!entry) return null;

        // Prefer MP3, fallback to M4A.
        try {
            if (entry.mp3 && this.musicEl.canPlayType('audio/mpeg')) return entry.mp3;
            if (entry.m4a && (this.musicEl.canPlayType('audio/mp4') || this.musicEl.canPlayType('audio/x-m4a'))) return entry.m4a;
            // Some browsers return "maybe" / "probably"; treat non-empty string as ok
            if (entry.mp3 && this.musicEl.canPlayType('audio/mpeg') !== '') return entry.mp3;
            if (entry.m4a && (this.musicEl.canPlayType('audio/mp4') !== '' || this.musicEl.canPlayType('audio/x-m4a') !== '')) return entry.m4a;
        } catch (e) {
            // ignore
        }
        // Last resort: try mp3 then m4a if present
        return entry.mp3 || entry.m4a || null;
    },

    applyMusicState() {
        // Don't try to autoplay until the user interacts at least once
        if (!this.unlocked) return;

        const next = this.desiredMusicState || 'menu';
        if (this.musicState === next && this.musicPlaying) return;
        this.musicState = next;

        const src = this.getTrackSrc(next);
        if (!src || !this.musicEl) {
            // Fallback to procedural loop if no src
            this.musicPlaying = true;
            this.playMusicLoop(this.biomeForProcedural);
            return;
        }

        try {
            // Swap track
            try { this.musicEl.pause(); } catch (e) {}
            this.musicEl.src = src;
            this.musicEl.currentTime = 0;
            this.musicEl.loop = true;

            const p = this.musicEl.play();
            this.musicPlaying = true;

            // Swallow autoplay errors gracefully (will retry on next gesture)
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    this.musicPlaying = false;
                    // If the file can't play, fallback to procedural instead of silence
                    this.playMusicLoop(this.biomeForProcedural);
                });
            }
        } catch (e) {
            this.musicPlaying = false;
        }
    },

    // ========================
    // PROCEDURAL MUSIC (fallback)
    // ========================

    playMusicLoop(biome) {
        if (!this.musicPlaying || !this.context) return;

        const duration = 4; // 4 seconds per phrase
        const now = this.context.currentTime;

        // Create a simple ambient music loop
        const notes = this.getMusicNotes(biome);

        notes.forEach((note) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = note.freq;

            const startTime = now + note.time;
            const noteLength = note.duration || 0.5;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0.05, startTime + noteLength * 0.5);
            gain.gain.linearRampToValueAtTime(0, startTime + noteLength);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(startTime);
            osc.stop(startTime + noteLength);
        });

        // Schedule next loop
        setTimeout(() => {
            if (this.musicPlaying && (!this.getTrackSrc(this.musicState) || !this.musicEl)) {
                this.playMusicLoop(biome);
            }
        }, duration * 1000);
    },

    getMusicNotes(biome) {
        // Simple ambient arpeggios based on biome
        const scales = {
            forest: [196, 247, 294, 370, 392, 494], // G minor
            crypt: [165, 196, 220, 262, 294, 330],  // E minor
            crystal: [262, 311, 392, 466, 523, 622], // C# minor
            volcano: [147, 175, 220, 262, 294, 349], // D minor
        };

        const scale = scales[biome] || scales.forest;
        const notes = [];

        for (let i = 0; i < 8; i++) {
            notes.push({
                freq: scale[i % scale.length] * (i < 4 ? 1 : 0.5),
                time: i * 0.5,
                duration: 0.8
            });
        }

        return notes;
    },

    // PROCEDURAL SOUNDS
    // ========================

    createShoot() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },

    createHit() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.08);
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.08);
    },

    createExplosion() {
        const bufferSize = this.context.sampleRate * 0.3;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        noise.buffer = buffer;
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
    },

    createPickup() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    },

    createDash() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    },

    createHurt() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    },

    createDeath() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!this.context) return;
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300 - i * 80, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
                gain.gain.setValueAtTime(0.3, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start();
                osc.stop(this.context.currentTime + 0.3);
            }, i * 100);
        }
    },

    createClick() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'square';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.uiGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    },

    createHover() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.value = 400;
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.uiGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.03);
    },

    createChest() {
        const notes = [400, 500, 600, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (!this.context) return;
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start();
                osc.stop(this.context.currentTime + 0.15);
            }, i * 80);
        });
    },

    createDoor() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.context.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }
};

window.AudioManager = AudioManager;
