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
  currentHoverTarget: null,

  /**
   * Módulo Utilitário de Arrastar e Soltar (Drag and Drop)
   * Versão Robusta com Feedback Visual Completo
   * Inclui mecanismo de bloqueio, auto-scroll e highlight de zonas de drop
   */
  makeDraggable(selector, onDrop, config = { mode: 'move' }) {
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

    // Limpar highlight de zona de drop
    if (this.currentHoverTarget) {
      this.currentHoverTarget.classList.remove('drag-over');
      this.currentHoverTarget = null;
    }

    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
    this.isLocked = false;
    this.scrollInterval = null;
  },

  dragStart(e) {
    if (this.draggedEl || this.isLocked) return;

    const el = e.currentTarget;

    // Impede drag se o símbolo já está em uma dropzone concluída
    if (
      el.parentElement &&
      el.parentElement.classList.contains('ligar-dropzone') &&
      el.parentElement.dataset.completed === 'true'
    ) {
      return;
    }

    e.preventDefault();
    this.isLocked = true;

    const isTouchEvent = e.type.startsWith('touch');
    const startX = isTouchEvent ? e.touches[0].pageX : e.pageX;
    const startY = isTouchEvent ? e.touches[0].pageY : e.pageY;

    if (this.config.mode === 'clone') {
      this.originalEl = el;
      this.draggedEl = el.cloneNode(true);
    } else {
      this.draggedEl = el;
      this.placeholder = document.createElement('div');
      // Placeholder visível com borda tracejada
      this.placeholder.className =
        'w-16 h-16 opacity-50 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400';
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
      pointerEvents: 'none', // Permite detectar elementos abaixo
    });
    this.draggedEl.classList.add('dragging');

    // Centraliza o elemento no cursor/dedo
    this.offsetX = this.draggedEl.offsetWidth / 2;
    this.offsetY = this.draggedEl.offsetHeight / 2;

    // Posição inicial com rotação suave
    this.draggedEl.style.transform = `translate(${startX - this.offsetX}px, ${
      startY - this.offsetY
    }px) scale(1.1) rotate(5deg)`;

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
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    // Atualizar posição com rotação
    this.draggedEl.style.transform = `translate(${moveX - this.offsetX}px, ${
      moveY - this.offsetY
    }px) scale(1.1) rotate(5deg)`;

    // Detectar zona de drop sob o cursor e aplicar highlight
    const dropTarget = document
      .elementFromPoint(clientX, clientY)
      ?.closest('.target');

    if (dropTarget !== this.currentHoverTarget) {
      // Remover highlight da zona anterior
      if (this.currentHoverTarget) {
        this.currentHoverTarget.classList.remove('drag-over');
      }

      // Adicionar highlight na nova zona
      if (dropTarget) {
        dropTarget.classList.add('drag-over');
      }

      this.currentHoverTarget = dropTarget;
    }

    // Auto-scroll quando próximo das bordas
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

    // Temporariamente esconder o elemento arrastado para detectar o que está abaixo
    this.draggedEl.style.display = 'none';
    const dropTarget = document
      .elementFromPoint(endX, endY)
      ?.closest('.target');
    this.draggedEl.style.display = '';

    // Remover highlight da zona de drop
    if (this.currentHoverTarget) {
      this.currentHoverTarget.classList.remove('drag-over');
      this.currentHoverTarget = null;
    }

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

    // Limpar classes e resetar pointer events
    this.draggedEl.classList.remove('dragging');
    if (this.draggedEl) {
      this.draggedEl.style.pointerEvents = '';
    }

    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
  },

  unlock() {
    this.isLocked = false;
  },
};
