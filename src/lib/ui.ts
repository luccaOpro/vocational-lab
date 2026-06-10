/*
  ui.ts — helpers de UI reutilizables para el aula.
  ---
  - showToast(mensaje, tipo) → notificación efímera abajo a la derecha.
  - confirmModal(opciones)   → modal de confirmación. Devuelve Promise<boolean>.
  - traducirError(error)     → traduce mensajes de error técnicos al castellano.
  - spinnerHTML(label?)      → string HTML con un spinner + label opcional.

  Requieren que <UIRoot /> esté en el DOM (lo incluye AulaLayout).
*/

/**
 * Traduce errores comunes de Supabase y del navegador a mensajes
 * legibles para el usuario final. Si no matchea ninguno conocido,
 * devuelve el mensaje original.
 */
export function traducirError(error: unknown): string {
  const msg = typeof error === "string"
    ? error
    : (error as { message?: string })?.message ?? String(error);

  // Auth
  if (msg.includes("Invalid login credentials")) return "Mail o contraseña incorrectos.";
  if (msg.includes("Email not confirmed")) return "Tu mail todavía no está confirmado. Revisá tu casilla (también en spam).";
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "Ese mail ya está registrado. Probá iniciar sesión.";
  }
  if (msg.includes("Password should be at least")) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (msg.includes("New password should be different")) return "La contraseña nueva tiene que ser distinta de la actual.";
  if (msg.includes("rate limit") || msg.includes("Too many requests")) {
    return "Demasiados intentos. Esperá un minuto y volvé a intentar.";
  }

  // Red
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network")) {
    return "No pudimos conectarnos. Revisá tu internet y volvé a intentar.";
  }

  // Storage
  if (msg.includes("Payload too large") || msg.includes("file size")) {
    return "El archivo es demasiado grande.";
  }

  // DB / RLS
  if (msg.includes("violates row-level security") || msg.includes("permission denied")) {
    return "No tienes permiso para hacer esa acción.";
  }
  if (msg.includes("violates not-null constraint")) {
    return "Falta completar un campo obligatorio.";
  }
  if (msg.includes("duplicate key") || msg.includes("violates unique constraint")) {
    return "Ya existe un registro con esos datos.";
  }

  return msg;
}

// ============================================================
// Modal de formulario
// ============================================================

export interface FormField {
  /** Nombre del campo (key del objeto resultado). */
  name: string;
  /** Texto que ve el usuario. */
  label: string;
  /** Tipo de input. Default: "text". */
  type?: "text" | "textarea" | "date" | "email";
  /** Si es obligatorio. */
  required?: boolean;
  /** Valor inicial (para edición). */
  value?: string;
  /** Texto guía cuando el campo está vacío. */
  placeholder?: string;
  /** Largo mínimo (para validación). */
  minLength?: number;
  /** Sólo para textarea: cantidad de líneas visibles. */
  rows?: number;
  /** Texto chico bajo el campo (ayuda). */
  hint?: string;
}

export interface FormOpts {
  titulo: string;
  /** Descripción opcional debajo del título. */
  mensaje?: string;
  campos: FormField[];
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Modal de formulario. Devuelve un objeto con los valores ingresados
 * (keyed por field.name), o null si el usuario cancela / cierra.
 */
export function formModal(opciones: FormOpts): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-form");
    if (!modal) {
      console.warn("[ui] modal-form no está en el DOM, fallback a prompt.");
      const result: Record<string, string> = {};
      for (const f of opciones.campos) {
        const v = window.prompt(f.label, f.value ?? "");
        if (v === null) { resolve(null); return; }
        result[f.name] = v;
      }
      resolve(result);
      return;
    }

    const $titulo = document.getElementById("modal-form-titulo") as HTMLElement;
    const $mensaje = document.getElementById("modal-form-mensaje") as HTMLElement;
    const $campos = document.getElementById("modal-form-campos") as HTMLElement;
    const $form = document.getElementById("modal-form-form") as HTMLFormElement;
    const $cancel = document.getElementById("modal-form-cancel") as HTMLButtonElement;
    const $ok = document.getElementById("modal-form-ok") as HTMLButtonElement;
    const $backdrop = modal.querySelector("[data-modal-backdrop]") as HTMLElement;

    $titulo.textContent = opciones.titulo;
    if (opciones.mensaje) {
      $mensaje.textContent = opciones.mensaje;
      $mensaje.hidden = false;
    } else {
      $mensaje.textContent = "";
      $mensaje.hidden = true;
    }
    $ok.textContent = opciones.confirmLabel ?? "Guardar";
    $cancel.textContent = opciones.cancelLabel ?? "Cancelar";

    // Render dinámico de los campos.
    $campos.innerHTML = opciones.campos.map(renderField).join("");

    // Asignar valores iniciales.
    for (const f of opciones.campos) {
      const el = $form.elements.namedItem(f.name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = f.value ?? "";
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");
    void modal.offsetWidth;
    modal.classList.add("modal--visible");

    // Auto-focus en el primer campo.
    requestAnimationFrame(() => {
      const first = $form.querySelector("input, textarea") as HTMLElement | null;
      first?.focus();
    });

    function cleanup(result: Record<string, string> | null) {
      modal.classList.remove("modal--visible");
      setTimeout(() => {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
      }, 200);
      $form.removeEventListener("submit", onSubmit);
      $cancel.removeEventListener("click", onCancel);
      $backdrop.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onEscape);
      resolve(result);
    }

    function onSubmit(e: Event) {
      e.preventDefault();
      const fd = new FormData($form);
      const result: Record<string, string> = {};
      for (const f of opciones.campos) {
        result[f.name] = String(fd.get(f.name) ?? "").trim();
      }
      cleanup(result);
    }
    function onCancel() { cleanup(null); }
    function onEscape(e: KeyboardEvent) { if (e.key === "Escape") cleanup(null); }

    $form.addEventListener("submit", onSubmit);
    $cancel.addEventListener("click", onCancel);
    $backdrop.addEventListener("click", onCancel);
    document.addEventListener("keydown", onEscape);
  });
}

function renderField(f: FormField): string {
  const id = `modal-field-${f.name}`;
  const type = f.type ?? "text";
  const required = f.required ? "required" : "";
  const minLength = f.minLength ? `minlength="${f.minLength}"` : "";
  const placeholder = f.placeholder ? `placeholder="${escAttr(f.placeholder)}"` : "";
  const labelStar = f.required ? " *" : "";
  const hint = f.hint ? `<small class="modal__campo-hint">${escAttr(f.hint)}</small>` : "";

  const inputHTML = type === "textarea"
    ? `<textarea id="${id}" name="${escAttr(f.name)}" rows="${f.rows ?? 4}" ${required} ${minLength} ${placeholder}></textarea>`
    : `<input id="${id}" name="${escAttr(f.name)}" type="${type}" ${required} ${minLength} ${placeholder} />`;

  return `
    <label class="modal__campo" for="${id}">
      <span class="modal__campo-label">${escAttr(f.label)}${labelStar}</span>
      ${inputHTML}
      ${hint}
    </label>
  `;
}

function escAttr(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Devuelve HTML para un spinner + label opcional.
 * Útil para usar dentro de innerHTML cuando se está cargando algo.
 */
export function spinnerHTML(label?: string): string {
  const escapedLabel = (label ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
    <div class="loader" role="status">
      <span class="loader__spinner" aria-hidden="true"></span>
      ${escapedLabel ? `<span class="loader__label">${escapedLabel}</span>` : ""}
    </div>
  `;
}

/**
 * Convierte el contenedor [data-dropzone] que envuelve a un <input type="file">
 * en zona de drag & drop: soltar un archivo equivale a elegirlo con el picker
 * (asigna los files al input y dispara "change", así la página reutiliza su
 * propia lógica de validación/subida sin duplicar nada).
 *
 * Es seguro llamarla en cada re-render: marca el contenedor para no
 * engancharle los listeners dos veces.
 */
export function setupDropzone(input: HTMLInputElement): void {
  const zona = input.closest<HTMLElement>("[data-dropzone]");
  if (!zona || zona.dataset.dropzoneListo === "true") return;
  zona.dataset.dropzoneListo = "true";

  ["dragover", "dragenter"].forEach((ev) => {
    zona.addEventListener(ev, (e) => {
      e.preventDefault();
      zona.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    zona.addEventListener(ev, () => zona.classList.remove("is-dragover"));
  });
  zona.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = (e as DragEvent).dataTransfer?.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      showToast("Subí un archivo por vez.", "info");
      return;
    }
    input.files = files;
    input.dispatchEvent(new Event("change", { bubbles: false }));
  });
}

export type ToastTipo = "ok" | "error" | "info";

/** Notificación efímera abajo a la derecha. Auto-desaparece. */
export function showToast(mensaje: string, tipo: ToastTipo = "ok"): void {
  const container = document.getElementById("toast-container");
  if (!container) {
    // Fallback: si UIRoot no está montado, log a consola.
    console.warn("[ui] toast-container no está en el DOM. ¿Falta <UIRoot /> en el layout?");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute("role", "status");

  // Iconito según tipo.
  const icono = tipo === "ok" ? "✓" : tipo === "error" ? "✗" : "ⓘ";
  toast.innerHTML = `<span class="toast__icono">${icono}</span><span class="toast__mensaje"></span>`;

  // El mensaje lo seteamos como textContent para evitar inyección.
  const $msg = toast.querySelector(".toast__mensaje") as HTMLElement;
  $msg.textContent = mensaje;

  container.appendChild(toast);
  // Forzar reflow para que la transición de entrada arranque.
  void toast.offsetWidth;
  toast.classList.add("toast--visible");

  // Auto-remover después de 4 segundos.
  const visibleMs = 4000;
  const salidaMs = 300;
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), salidaMs);
  }, visibleMs);
}

export interface ConfirmOpts {
  /** Título grande del modal. */
  titulo: string;
  /** Texto descriptivo (opcional). */
  mensaje?: string;
  /** Texto del botón principal. Default: "Confirmar". */
  confirmLabel?: string;
  /** Texto del botón secundario. Default: "Cancelar". */
  cancelLabel?: string;
  /** Si true, el botón principal usa el color rojo de "destructivo". */
  danger?: boolean;
}

/**
 * Modal de confirmación. Devuelve true si el usuario confirma,
 * false si cancela o cierra (Escape, click en backdrop, etc.).
 */
export function confirmModal(opciones: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-confirm");
    if (!modal) {
      console.warn("[ui] modal-confirm no está en el DOM, fallback a confirm() nativo.");
      resolve(window.confirm(opciones.mensaje ?? opciones.titulo));
      return;
    }

    const $titulo = document.getElementById("modal-confirm-titulo") as HTMLElement;
    const $mensaje = document.getElementById("modal-confirm-mensaje") as HTMLElement;
    const $btnOk = document.getElementById("modal-confirm-ok") as HTMLButtonElement;
    const $btnCancel = document.getElementById("modal-confirm-cancel") as HTMLButtonElement;
    const $backdrop = modal.querySelector("[data-modal-backdrop]") as HTMLElement;

    $titulo.textContent = opciones.titulo;

    if (opciones.mensaje) {
      $mensaje.textContent = opciones.mensaje;
      $mensaje.hidden = false;
    } else {
      $mensaje.textContent = "";
      $mensaje.hidden = true;
    }

    $btnOk.textContent = opciones.confirmLabel ?? "Confirmar";
    $btnCancel.textContent = opciones.cancelLabel ?? "Cancelar";
    $btnOk.className = `modal__btn modal__btn--${opciones.danger ? "danger" : "primary"}`;

    modal.hidden = false;
    document.body.classList.add("modal-open");
    // Forzar reflow para la animación de entrada.
    void modal.offsetWidth;
    modal.classList.add("modal--visible");

    // Focus al botón principal para accesibilidad.
    requestAnimationFrame(() => $btnOk.focus());

    function cleanup(resultado: boolean) {
      modal.classList.remove("modal--visible");
      setTimeout(() => {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
      }, 200);
      $btnOk.removeEventListener("click", onConfirm);
      $btnCancel.removeEventListener("click", onCancel);
      $backdrop.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onEscape);
      resolve(resultado);
    }

    function onConfirm() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") cleanup(false);
    }

    $btnOk.addEventListener("click", onConfirm);
    $btnCancel.addEventListener("click", onCancel);
    $backdrop.addEventListener("click", onCancel);
    document.addEventListener("keydown", onEscape);
  });
}
