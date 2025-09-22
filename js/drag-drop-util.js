const DraggableManager = {
  draggedEl: null,
  placeholder: null,
  originalEl: null,
  offsetX: 0,
  offsetY: 0,
  onDropCallback: null,
  isLocked: false,
  scrollInterval: null,
  config: { mode: 'move' },

  /**
   * Módulo Utilitário de Arrastar e Soltar (Drag and Drop)
   * Versão Robusta: Gerencia a criação, movimento e limpeza de elementos arrastáveis.
   * Inclui um mecanismo de bloqueio e auto-scroll da página.
   */
  makeDraggable(selector, onDrop, config = { mode: 'move' }) {
    // A linha this.cleanup(); foi removida daqui.
    this.config = config;
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('mousedown', this.dragStart.bind(this));
      el.addEventListener('touchstart', this.dragStart.bind(this), {
        passive: false,
      });
    });
    this.onDropCallback = onDrop;
  },

  cleanup() {
    if (this.scrollInterval) clearInterval(this.scrollInterval);
    document.removeEventListener('mousemove', this._dragMove);
    document.removeEventListener('touchmove', this._dragMove);
    document.removeEventListener('mouseup', this._dragEnd);
    document.removeEventListener('touchend', this._dragEnd);
    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
    this.isLocked = false;
    this.scrollInterval = null;
  },

  dragStart(e) {
    if (this.draggedEl || this.isLocked) return;
    e.preventDefault();
    this.isLocked = true;

    const el = e.currentTarget;
    const isTouchEvent = e.type.startsWith('touch');
    const startX = isTouchEvent ? e.touches[0].pageX : e.pageX;
    const startY = isTouchEvent ? e.touches[0].pageY : e.pageY;

    if (this.config.mode === 'clone') {
      this.originalEl = el;
      this.draggedEl = el.cloneNode(true);
    } else {
      this.draggedEl = el;
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'w-16 h-16';
      el.parentElement.insertBefore(this.placeholder, el);
    }

    const rect = el.getBoundingClientRect();
    document.body.appendChild(this.draggedEl);

    Object.assign(this.draggedEl.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: '1000',
      cursor: 'grabbing',
    });
    this.draggedEl.classList.add('dragging');

    // Centraliza o elemento no cursor/dedo
    this.offsetX = this.draggedEl.offsetWidth / 2;
    this.offsetY = this.draggedEl.offsetHeight / 2;

    // Define a posição inicial correta usando transform e coordenadas da página
    this.draggedEl.style.transform = `translate(${startX - this.offsetX}px, ${
      startY - this.offsetY
    }px) scale(1.1)`;

    this._dragMove = this._dragMove.bind(this);
    this._dragEnd = this._dragEnd.bind(this);
    document.addEventListener('mousemove', this._dragMove);
    document.addEventListener('touchmove', this._dragMove, { passive: false });
    document.addEventListener('mouseup', this._dragEnd);
    document.addEventListener('touchend', this._dragEnd);
  },

  _dragMove(e) {
    if (!this.draggedEl) return;
    e.preventDefault();
    const isTouchEvent = e.type.startsWith('touch');
    const moveX = isTouchEvent ? e.touches[0].pageX : e.pageX;
    const moveY = isTouchEvent ? e.touches[0].pageY : e.pageY;

    this.draggedEl.style.transform = `translate(${moveX - this.offsetX}px, ${
      moveY - this.offsetY
    }px) scale(1.1)`;

    // A lógica de scroll usa clientY, que é relativo à janela de visualização
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    const scrollZone = window.innerHeight * 0.15;
    const scrollSpeed = 10;

    if (clientY < scrollZone) {
      if (!this.scrollInterval) {
        this.scrollInterval = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 16);
      }
    } else if (clientY > window.innerHeight - scrollZone) {
      if (!this.scrollInterval) {
        this.scrollInterval = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
        }, 16);
      }
    } else {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
      }
    }
  },

  _dragEnd(e) {
    if (!this.draggedEl) return;

    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    document.removeEventListener('mousemove', this._dragMove);
    document.removeEventListener('touchmove', this._dragMove);
    document.removeEventListener('mouseup', this._dragEnd);
    document.removeEventListener('touchend', this._dragEnd);

    const endX = e.clientX || e.changedTouches[0].clientX;
    const endY = e.clientY || e.changedTouches[0].clientY;

    this.draggedEl.style.display = 'none';
    const dropTarget = document
      .elementFromPoint(endX, endY)
      ?.closest('.target');
    this.draggedEl.style.display = '';

    if (this.onDropCallback) {
      this.onDropCallback(
        this.draggedEl,
        dropTarget,
        this.placeholder,
        this.unlock.bind(this)
      );
    } else {
      this.unlock();
    }

    this.draggedEl.classList.remove('dragging');
    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
  },

  unlock() {
    this.isLocked = false;
  },
};
