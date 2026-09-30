// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void } };
};

/**
 * Wraps the shared #confirm-modal (see CLAUDE.md "Modals"): replaces the native confirm() for
 * actions that need a yes/no check, with the message and the action to run on confirm changing
 * every time. Shared (not owned by a single screen) since both PlayScreenUI (selling an asset,
 * Wedding/Anniversary) and MainMenuUI (overwriting a saved game) need it.
 */
class ConfirmModal {
    private confirmModal = document.getElementById("confirm-modal") as HTMLDivElement;
    private confirmMessage = document.getElementById("confirm-message") as HTMLParagraphElement;
    private btnConfirmOk = document.getElementById("btn-confirm-ok") as HTMLButtonElement;
    private confirmCallback: (() => void) | null = null;

    constructor() {
        this.btnConfirmOk.addEventListener("click", () => {
            this.confirmCallback?.();
            this.confirmCallback = null;
        });
    }

    /**
     * Opens the confirm modal and runs onConfirm only if the user confirms.
     */
    public confirm(message: string, onConfirm: () => void) {
        this.confirmMessage.textContent = message;
        this.confirmCallback = onConfirm;
        bootstrap.Modal.getOrCreateInstance(this.confirmModal).show();
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const confirmModal = new ConfirmModal();
