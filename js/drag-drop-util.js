/**
 * Módulo Utilitário de Arrastar e Soltar (Drag and Drop)
 * Versão Robusta: Gerencia a criação, movimento e limpeza de elementos arrastáveis.
 * Inclui um mecanismo de bloqueio para prevenir bugs de cliques rápidos.
 */
const DraggableManager = {
  draggedEl: null,
  placeholder: null,
  originalEl: null, // Referência ao elemento original no modo clone
  offsetX: 0,
  offsetY: 0,
  onDropCallback: null,
  isLocked: false, // Trava para evitar cliques múltiplos
  config: { mode: "move" }, // 'move' ou 'clone'

  // Adiciona os listeners de início de arrasto
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

  // Remove todos os listeners para prevenir vazamentos entre jogos
  cleanup() {
    document.querySelectorAll(".draggable").forEach((el) => {
      el.removeEventListener("mousedown", this.dragStart);
      el.removeEventListener("touchstart", this.dragStart);
    });
    document.removeEventListener("mousemove", this._dragMove);
    document.removeEventListener("touchmove", this._dragMove);
    document.removeEventListener("mouseup", this._dragEnd);
    document.removeEventListener("touchend", this._dragEnd);
    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
    this.isLocked = false;
  },

  dragStart(e) {
    // Se já houver um item sendo arrastado ou se a trava estiver ativa, ignora
    if (this.draggedEl || this.isLocked) return;
    e.preventDefault();

    // Ativa a trava
    this.isLocked = true;

    const el = e.currentTarget;

    if (this.config.mode === "clone") {
      this.originalEl = el;
      this.draggedEl = el.cloneNode(true); // O elemento arrastado é um clone
    } else {
      // modo 'move'
      this.draggedEl = el;
      this.placeholder = document.createElement("div");
      this.placeholder.className = "w-16 h-16";
      el.parentElement.insertBefore(this.placeholder, el);
    }

    const rect = el.getBoundingClientRect();
    document.body.appendChild(this.draggedEl);

    Object.assign(this.draggedEl.style, {
      position: "absolute",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: "1000",
      cursor: "grabbing",
      transform: "scale(1.1)",
    });
    this.draggedEl.classList.add("dragging");

    this.offsetX = this.draggedEl.offsetWidth / 2;
    this.offsetY = this.draggedEl.offsetHeight / 2;

    const moveX = e.clientX || e.touches[0].clientX;
    const moveY = e.clientY || e.touches[0].clientY;
    this.draggedEl.style.left = `${moveX - this.offsetX}px`;
    this.draggedEl.style.top = `${moveY - this.offsetY}px`;

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
    const moveX = e.clientX || e.touches[0].clientX;
    const moveY = e.clientY || e.touches[0].clientY;
    this.draggedEl.style.left = `${moveX - this.offsetX}px`;
    this.draggedEl.style.top = `${moveY - this.offsetY}px`;
  },

  _dragEnd(e) {
    if (!this.draggedEl) return;

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
      // A função de callback agora é responsável por destravar (this.unlock())
      this.onDropCallback(
        this.draggedEl,
        dropTarget,
        this.placeholder,
        this.unlock.bind(this)
      );
    } else {
      // Se não houver callback, destrava imediatamente
      this.unlock();
    }

    this.draggedEl.classList.remove("dragging");
    this.draggedEl = null;
    this.placeholder = null;
    this.originalEl = null;
  },

  // Nova função para liberar a trava
  unlock() {
    this.isLocked = false;
  },
};
