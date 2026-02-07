// ==========================================
// ARCANE DEPTHS - Entry Point
// ==========================================

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔮 SpelLike - Initializing...');

    // Initialize systems
    Input.init();

    // Meta progression (Codex + Achievements)
    if (window.Meta && typeof Meta.init === 'function') {
        Meta.init();
    }

    // Audio needs a user gesture to start (browser autoplay policy).
    // IMPORTANT: init() alone is not enough; we must also unlock via userGesture().
    const unlockAudioOnce = () => {
        try {
            if (!AudioManager.context) AudioManager.init();
            AudioManager.userGesture();

            // Hide the "click/key to enable audio" hint once audio is unlocked
            const hint = document.getElementById('audio-unlock-hint');
            if (hint) hint.classList.add('hidden');
        } catch (e) {
            // ignore
        }
    };

    // First pointer interaction (mouse/touch)
    document.addEventListener('pointerdown', unlockAudioOnce, { once: true });
    // First keyboard interaction
    document.addEventListener('keydown', unlockAudioOnce, { once: true });

    // Boot sequence: preload critical external assets, then start the game.
    (async () => {
        try {
            if (window.Sprites && typeof Sprites.preloadExternalPlayer === 'function') {
                await Sprites.preloadExternalPlayer();
            
                if (typeof Sprites.preloadChargerSkin === 'function') {
                    await Sprites.preloadChargerSkin();

                    if (typeof Sprites.preloadMageSkin === 'function') {
                        await Sprites.preloadMageSkin();
                    }
                    if (typeof Sprites.preloadArcherSkin === 'function') {
                        await Sprites.preloadArcherSkin();
                    }

                    // Tank (Brute) external skin
                    if (typeof Sprites.preloadBruteSkin === 'function') {
                        await Sprites.preloadBruteSkin();
                    }
                }
}
        } catch (e) {
            // ignore and keep booting
        }

        // Initialize game
        Game.init();

        // Initialize UI
        UI.init();
    })();

    // Load settings
    const settings = SaveManager.getSettings();
    document.getElementById('vol-master').value = settings.audio.master;
    document.getElementById('vol-music').value = settings.audio.music;
    document.getElementById('vol-sfx').value = settings.audio.sfx;
    document.getElementById('vol-ui').value = settings.audio.ui;

    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.nextElementSibling.textContent = slider.value + '%';
    });

    if (settings.graphics) {
        document.getElementById('opt-screenshake').checked = settings.graphics.screenshake;
        document.getElementById('opt-particles').checked = settings.graphics.particles;
        document.getElementById('opt-hitflash').checked = settings.graphics.hitflash;
    }

    console.log('✅ SpelLike - Ready!');
});
