// ===== TUTORIAL SYSTEM =====
const TutorialManager = {
    STORAGE_KEY: 'spellike_tutorial_skip',
    currentPage: 0,
    totalPages: 3,

    shouldShow() {
        if (window.Game && Game.difficulty && Game.difficulty !== 'normal') return false;
        try { return localStorage.getItem(this.STORAGE_KEY) !== '1'; }
        catch(e) { return true; }
    },

    setDoNotShow() {
        try { localStorage.setItem(this.STORAGE_KEY, '1'); } catch(e) {}
    },

    show() {
        console.log('[Tutorial] show() called. difficulty=' + (window.Game ? Game.difficulty : 'N/A') + ' shouldShow=' + this.shouldShow());
        if (!this.shouldShow()) {
            console.log('[Tutorial] shouldShow() returned false — skipping');
            return;
        }
        this.init();
        const overlay = document.getElementById('tutorial-overlay');
        console.log('[Tutorial] overlay element:', overlay);
        if (!overlay) return;
        overlay.style.display = 'flex';
        console.log('[Tutorial] overlay display set to flex, z-index=' + overlay.style.zIndex);
        this.goToPage(0);
    },

    hide() {
        const overlay = document.getElementById('tutorial-overlay');
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.querySelectorAll('video').forEach(v => { v.pause(); v.currentTime = 0; });
    },

    isOpen() {
        const overlay = document.getElementById('tutorial-overlay');
        return overlay && overlay.style.display !== 'none';
    },

    goToPage(index) {
        if (index < 0 || index >= this.totalPages) return;
        this.currentPage = index;

        document.querySelectorAll('.tutorial-page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById('tutorial-page-' + index);
        if (page) page.classList.add('active');

        document.querySelectorAll('.tutorial-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        const btnBack = document.getElementById('tutorial-btn-back');
        if (btnBack) btnBack.style.display = index === 0 ? 'none' : 'inline-flex';

        const btnNext = document.getElementById('tutorial-btn-next');
        if (btnNext) {
            if (index === this.totalPages - 1) {
                btnNext.textContent = 'Finalizar Tutorial';
                btnNext.classList.add('finish');
            } else {
                btnNext.textContent = 'Siguiente →';
                btnNext.classList.remove('finish');
            }
        }

        const video = page ? page.querySelector('video') : null;
        if (video) {
            document.querySelectorAll('.tutorial-page video').forEach(v => {
                if (v !== video) { v.pause(); v.currentTime = 0; }
            });
            video.muted = true;
            video.loop = true;
            const p = video.play();
            if (p) p.catch(() => {
                const tryPlay = () => { video.play().catch(()=>{}); };
                document.addEventListener('click', tryPlay, { once: true });
                document.addEventListener('keydown', tryPlay, { once: true });
            });
        }
    },

    next() {
        if (this.currentPage < this.totalPages - 1) this.goToPage(this.currentPage + 1);
        else this.hide();
    },

    back() {
        if (this.currentPage > 0) this.goToPage(this.currentPage - 1);
    },

    init() {
        if (document.getElementById('tutorial-overlay')) return;

        // Insert DIRECTLY into body with extreme z-index - bypasses any stacking context issues
        const div = document.createElement('div');
        div.id = 'tutorial-overlay';
        div.style.cssText = [
            'position:fixed',
            'inset:0',
            'background:rgba(0,0,0,0.88)',
            'display:none',               // hidden by default, show() sets display:flex
            'align-items:center',
            'justify-content:center',
            'z-index:2147483647',          // MAX possible z-index
            'font-family:Segoe UI,Arial,sans-serif'
        ].join(';');

        div.innerHTML = `<div class="tutorial-box">
    <div class="tutorial-header">
      <h2 class="tutorial-title">⚔ Tutorial</h2>
      <div class="tutorial-page-indicator">
        <div class="tutorial-dot active"></div>
        <div class="tutorial-dot"></div>
        <div class="tutorial-dot"></div>
      </div>
    </div>
    <div class="tutorial-page active" id="tutorial-page-0">
      <div class="tutorial-content">
        <div class="tutorial-text-panel">
          <h3 class="tutorial-section-title">🎮 Movimiento</h3>
          <p class="tutorial-description">Usá el teclado para mover a tu personaje por el dungeon. El movimiento es en 4 direcciones y podés combinar teclas para moverte en diagonal.</p>
          <ul class="tutorial-keys-list">
            <li><span class="key-badge">W</span><span class="arrow">→</span>Mover hacia <strong>arriba</strong></li>
            <li><span class="key-badge">A</span><span class="arrow">→</span>Mover hacia la <strong>izquierda</strong></li>
            <li><span class="key-badge">S</span><span class="arrow">→</span>Mover hacia <strong>abajo</strong></li>
            <li><span class="key-badge">D</span><span class="arrow">→</span>Mover hacia la <strong>derecha</strong></li>
            <li><span class="key-badge">W</span>+<span class="key-badge">A</span><span class="arrow">→</span>Diagonal <strong>arriba-izquierda</strong></li>
            <li><span class="key-badge">W</span>+<span class="key-badge">D</span><span class="arrow">→</span>Diagonal <strong>arriba-derecha</strong></li>
            <li><span class="key-badge">S</span>+<span class="key-badge">A</span><span class="arrow">→</span>Diagonal <strong>abajo-izquierda</strong></li>
            <li><span class="key-badge">S</span>+<span class="key-badge">D</span><span class="arrow">→</span>Diagonal <strong>abajo-derecha</strong></li>
          </ul>
          <div class="tutorial-note">💡 <strong>Tip:</strong> Mantenete en movimiento para esquivar proyectiles. ¡Un jugador quieto es un blanco fácil!</div>
        </div>
        <div class="tutorial-video-panel"><video src="MOVEMENT.mp4" muted loop playsinline></video></div>
      </div>
    </div>
    <div class="tutorial-page" id="tutorial-page-1">
      <div class="tutorial-content">
        <div class="tutorial-text-panel">
          <h3 class="tutorial-section-title">💨 Dash</h3>
          <p class="tutorial-description">El dash es un impulso veloz para esquivar ataques. Durante el dash sos <strong>invulnerable</strong>. Combina la dirección de movimiento con <span class="key-badge">SPACE</span>:</p>
          <ul class="tutorial-keys-list">
            <li><span class="key-badge">W</span>+<span class="key-badge">SPACE</span><span class="arrow">→</span>Dash hacia <strong>arriba</strong></li>
            <li><span class="key-badge">S</span>+<span class="key-badge">SPACE</span><span class="arrow">→</span>Dash hacia <strong>abajo</strong></li>
            <li><span class="key-badge">A</span>+<span class="key-badge">SPACE</span><span class="arrow">→</span>Dash hacia la <strong>izquierda</strong></li>
            <li><span class="key-badge">D</span>+<span class="key-badge">SPACE</span><span class="arrow">→</span>Dash hacia la <strong>derecha</strong></li>
            <li><span class="key-badge">W/A/S/D</span>(diagonal)+<span class="key-badge">SPACE</span><span class="arrow">→</span>Dash <strong>diagonal</strong></li>
          </ul>
          <div class="tutorial-note">⏱️ <strong>Cooldown del Dash: 1.2 segundos.</strong> Después de usarlo tenés que esperar antes de volver a dashear. ¡Usalo en los momentos de mayor peligro!</div>
        </div>
        <div class="tutorial-video-panel"><video src="Dash.mp4" muted loop playsinline></video></div>
      </div>
    </div>
    <div class="tutorial-page" id="tutorial-page-2">
      <div class="tutorial-content">
        <div class="tutorial-text-panel">
          <h3 class="tutorial-section-title">❤️ Curación</h3>
          <p class="tutorial-description">Para recuperar vida usá las <strong>pociones</strong> que encontrás en el dungeon. Al recoger una poción, recuperás vida instantáneamente.</p>
          <ul class="tutorial-keys-list">
            <li><span class="key-badge">Poción</span><span class="arrow">→</span>Recuperás vida al <strong>recogerla</strong></li>
            <li><span class="key-badge">E</span><span class="arrow">→</span>Usá pociones del <strong>inventario</strong> (si tenés)</li>
          </ul>
          <div class="tutorial-note">⚠️ <strong>¡Importante!</strong> Si ya tenés la <strong>vida al máximo</strong>, las pociones <strong>no tendrán efecto</strong>. ¡Guardalas para cuando realmente las necesitás!</div>
        </div>
        <div class="tutorial-video-panel"><video src="Life.mp4" muted loop playsinline></video></div>
      </div>
    </div>
    <div class="tutorial-footer">
      <button class="tutorial-btn-donotshow" id="tutorial-btn-skip">No mostrar más</button>
      <div class="tutorial-nav">
        <button class="tutorial-btn-back" id="tutorial-btn-back" style="display:none">← Atrás</button>
        <button class="tutorial-btn-next" id="tutorial-btn-next">Siguiente →</button>
      </div>
    </div>
</div>`;

        document.body.appendChild(div);

        document.getElementById('tutorial-btn-next').addEventListener('click', () => {
            if (window.AudioManager) AudioManager.play('menuClick');
            TutorialManager.next();
        });
        document.getElementById('tutorial-btn-back').addEventListener('click', () => {
            if (window.AudioManager) AudioManager.play('menuClick');
            TutorialManager.back();
        });
        document.getElementById('tutorial-btn-skip').addEventListener('click', () => {
            if (window.AudioManager) AudioManager.play('menuClick');
            TutorialManager.setDoNotShow();
            TutorialManager.hide();
        });
    }
};
