/** Keyboard + multi-touch input mapped to physical key codes. */
export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.enabled = true;
    this.touchActive = false;

    this._onKeyDown = (e) => {
      const code = e.code;
      if (PREVENT.has(code)) e.preventDefault();
      if (!this.enabled) return;
      if (code === "Space" || code === "Enter") e.preventDefault();
      if (e.repeat) return;
      if (!this.held.has(code)) this.pressed.add(code);
      this.held.add(code);
    };
    this._onKeyUp = (e) => {
      const code = e.code;
      this.held.delete(code);
      this.released.add(code);
      if (PREVENT.has(code)) e.preventDefault();
    };
    this._onBlur = () => {
      this.held.clear();
      this.pressed.clear();
    };

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp, { passive: false });
    window.addEventListener("blur", this._onBlur);
  }

  down(code) {
    if (!this.held.has(code)) this.pressed.add(code);
    this.held.add(code);
  }

  up(code) {
    this.held.delete(code);
    this.released.add(code);
  }

  isHeld(code) {
    return this.held.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }

  clear() {
    this.held.clear();
    this.pressed.clear();
  }

  /** Bind pointer events on elements carrying data-code attributes. */
  bindTouch(root) {
    const activePointers = new Map();
    const clearBtn = (btn) => btn.classList.remove("active");

    root.querySelectorAll("[data-code]").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          btn.setPointerCapture?.(e.pointerId);
        } catch {
          /* synthetic or already-released pointer */
        }
        const code = btn.dataset.code;
        activePointers.set(e.pointerId, { code, btn });
        btn.classList.add("active");
        this.touchActive = true;
        this.down(code);
      });
      const release = (e) => {
        const rec = activePointers.get(e.pointerId);
        if (!rec) return;
        activePointers.delete(e.pointerId);
        this.up(rec.code);
        clearBtn(rec.btn);
      };
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointercancel", release);
      btn.addEventListener("lostpointercapture", release);
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  }
}

const PREVENT = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Space", "Enter", "KeyW", "KeyA", "KeyS", "KeyD",
  "KeyJ", "KeyK", "KeyL", "KeyI", "KeyP",
  "Digit1", "Digit2", "Digit3", "Digit4",
  "Numpad1", "Numpad2", "Numpad3", "Numpad4",
]);
