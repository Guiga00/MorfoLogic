/**
 * Módulo Utilitário de Arrastar e Soltar (Drag and Drop)
 * Versão Robusta: Gerencia a criação, movimento e limpeza de elementos arrastáveis.
 * Inclui um mecanismo de bloqueio e auto-scroll da página.
 */
const DraggableManager = {
  draggedEl: null,
  placeholder: null,
  originalEl: null,
  offsetX: 0,
  offsetY: 0,
  onDropCallback: null,
  isLocked: false,
  scrollInterval: null,
  config: { mode: "move" },

  makeDraggable(selector, onDrop, config = { mode: "move" }) {
    this.cleanup();
    this.config = config;
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("mousedown", this.dragStart.bind(this));
      el.addEventListener("touchstart", this.dragStart.bind(this), {
        passive: false,
      });
    });
    this.onDropCallback = onDrop;
  },

  cleanup() {
    if (this.scrollInterval) clearInterval(this.scrollInterval);
    document.querySelectorAll(".draggable").forEach((el) => {
      // A melhor abordagem para remover listeners de forma segura é reiniciar o HTML do jogo.
    });
    document.removeEventListener("mousemove", this._dragMove);
    document.removeEventListener("touchmove", this._dragMove);
    document.removeEventListener("mouseup", this._dragEnd);
    document.removeEventListener("touchend", this._dragEnd);
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
    const isTouchEvent = e.type.startsWith("touch");
    const startX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const startY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    if (this.config.mode === "clone") {
      this.originalEl = el;
      this.draggedEl = el.cloneNode(true);
    } else {
      this.draggedEl = el;
      this.placeholder = document.createElement("div");
      this.placeholder.className = "w-16 h-16";
      el.parentElement.insertBefore(this.placeholder, el);
    }

    const rect = el.getBoundingClientRect();
    document.body.appendChild(this.draggedEl);

    Object.assign(this.draggedEl.style, {
      position: "absolute",
      left: `${rect.left + window.scrollX}px`,
      top: `${rect.top + window.scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: "1000",
      cursor: "grabbing",
      transform: "scale(1.1)",
    });
    this.draggedEl.classList.add("dragging");

    this.offsetX = this.draggedEl.offsetWidth / 2;
    this.offsetY = this.draggedEl.offsetHeight / 2;

    this.draggedEl.style.left = `${startX - this.offsetX}px`;
    this.draggedEl.style.top = `${startY - this.offsetY}px`;

    this._dragMove = this._dragMove.bind(this);
    this._dragEnd = this._dragEnd.bind(this);
    document.addEventListener("mousemove", this._dragMove);
    document.addEventListener("touchmove", this._dragMove, { passive: false });
    document.addEventListener("mouseup", this._dragEnd);
    document.addEventListener("touchend", this._dragEnd);
  },

  _dragMove(e) {
    if (!this.draggedEl) return;
    e.preventDefault();
    const isTouchEvent = e.type.startsWith("touch");
    const moveX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const moveY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    this.draggedEl.style.left = `${moveX - this.offsetX}px`;
    this.draggedEl.style.top = `${moveY - this.offsetY}px`;

    const scrollZone = window.innerHeight * 0.15;
    const scrollSpeed = 10;

    if (moveY < scrollZone) {
      if (!this.scrollInterval) {
        this.scrollInterval = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 16);
      }
    } else if (moveY > window.innerHeight - scrollZone) {
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

    document.removeEventListener("mousemove", this._dragMove);
    document.removeEventListener("touchmove", this._dragMove);
    document.removeEventListener("mouseup", this._dragEnd);
    document.removeEventListener("touchend", this._dragEnd);

    this.draggedEl.style.display = "none";
    const endX = e.clientX || e.changedTouches[0].clientX;
    const endY = e.clientY || e.changedTouches[0].clientY;
    const dropTarget = document
      .elementFromPoint(endX, endY)
      ?.closest(".target");
    this.draggedEl.style.display = "";

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

    this.draggedEl.classList.remove("dragging");
    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
  },

  unlock() {
    this.isLocked = false;
  },
};
