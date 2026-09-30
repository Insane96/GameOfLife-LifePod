import {persistence} from "../Persistence.js";

// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void, hide(): void } };
};

/**
 * Wraps #save-editor-modal (see CLAUDE.md "Modals"): a raw JSON editor over lifepod.save, for
 * fixing a game state by hand. Only checks the text is valid JSON before writing it
 * (persistence.setRaw), never against the Game/Player/Lottery shape: the existing load path
 * (run from "Continue game") already reports and clears a broken save, so there is no need to
 * duplicate that validation here.
 */
class SaveEditorUI {
    private modal = document.getElementById("save-editor-modal") as HTMLDivElement;
    private textarea = document.getElementById("input-save-editor") as HTMLTextAreaElement;
    private errorBox = document.getElementById("save-editor-error") as HTMLDivElement;
    private btnSave = document.getElementById("btn-save-editor-save") as HTMLButtonElement;

    constructor() {
        this.modal.addEventListener("show.bs.modal", () => {
            this.clearError();
            this.textarea.value = persistence.getRaw() ?? "";
        });
        this.btnSave.addEventListener("click", () => {
            this.clearError();
            let parsed: unknown;
            try {
                parsed = JSON.parse(this.textarea.value);
            }
            catch (e) {
                this.showError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
                return;
            }
            persistence.setRaw(JSON.stringify(parsed));
            bootstrap.Modal.getOrCreateInstance(this.modal).hide();
        });
    }

    private showError(message: string) {
        this.errorBox.textContent = message;
        this.errorBox.classList.remove("d-none");
    }

    private clearError() {
        this.errorBox.classList.add("d-none");
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const saveEditorUI = new SaveEditorUI();
