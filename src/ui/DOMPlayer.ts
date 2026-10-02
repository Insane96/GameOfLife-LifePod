import {PlayerColor} from "../PlayerColor.js";
import {Player} from "../Player.js";
import {t} from "../i18n/I18n.js";

export class DOMPlayer {
    public id: number;
    public color: PlayerColor | null = null;

    private _domElement: HTMLElement | null = null;

    public player: Player | null = null;

    constructor(id: number) {
        this.id = id;
    }

    public get domElement(): HTMLElement | null {
        return this._domElement;
    }

    public createDOMElement(updateColorGrid: () => void, onTryRemove: (id: number) => boolean): HTMLElement {
        let div = document.createElement("div");
        div.id = "player-" + this.id;
        div.classList.add("d-flex", "flex-wrap", "justify-content-center", "align-items-center", "gap-2", "rounded-4", "bg-body-secondary", "p-2");

        let textBox = document.createElement("input");
        textBox.id = `txt-player-${this.id}-name`;
        textBox.type = "text";
        // w-auto: form-control is width: 100% by default, which would fill the whole row
        textBox.classList.add("form-control", "w-auto");
        div.appendChild(textBox);

        let colorPicker = document.getElementById("color-picker-template")?.cloneNode(true) as HTMLElement;
        colorPicker.id = "player-color-picker-" + this.id;
        colorPicker.classList.remove("d-none");
        // flex-nowrap keeps the circles together: if they don't fit next to the name, the whole group wraps
        colorPicker.classList.add("color-picker", "d-flex", "flex-nowrap", "gap-2");
        colorPicker.querySelectorAll<HTMLInputElement>(".color-picker-circle").forEach((circle: HTMLInputElement) => {
            circle.name = circle.name.replace("x", String(this.id));
            circle.id = circle.id.replace("x", String(this.id));
            circle.addEventListener("click", () => {
                this.selectColor(PlayerColor[circle.dataset.color as keyof typeof PlayerColor]);
                updateColorGrid();
            })
        });
        div.appendChild(colorPicker);

        let removePlayer = document.createElement("button");
        removePlayer.id = "btn-remove-player-" + this.id;
        removePlayer.classList.add("btn", "btn-outline-danger", "btn-icon");
        removePlayer.addEventListener("click", () => {
            if (!onTryRemove(this.id))
                return;
            div.remove();
        });
        let removeIcon = document.createElement("i");
        removeIcon.classList.add("bi", "bi-x-lg");
        removeIcon.ariaHidden = "true";
        removePlayer.appendChild(removeIcon);
        // Placed before the name, so it stays in the first row when the colors wrap
        div.insertBefore(removePlayer, textBox);

        this._domElement = div;
        this.translate();
        return div;
    }

    /**
     * Texts with the player number in them, which a data-i18n attribute can't carry. Called on
     * creation and on every language change (by MainMenuUI). An empty name falls back to the
     * placeholder (see getName), so the default name follows the language too.
     */
    public translate() {
        const textBox = this._domElement?.querySelector<HTMLInputElement>(`#txt-player-${this.id}-name`);
        const removePlayer = this._domElement?.querySelector<HTMLButtonElement>(`#btn-remove-player-${this.id}`);
        if (!textBox || !removePlayer)
            return;
        textBox.placeholder = t("menu.playerPlaceholder", {number: this.id + 1});
        textBox.ariaLabel = t("menu.playerNameLabel", {number: this.id + 1});
        removePlayer.ariaLabel = t("menu.removePlayer");
    }

    public selectColor(color: PlayerColor) {
        this.color = color;
        this._domElement?.querySelectorAll<HTMLInputElement>(".color-picker-circle").forEach((circle: HTMLInputElement) => {
            circle.checked = circle.dataset.color === PlayerColor[color];
        });
    }

    public getName(): string {
        let txtPlayerName = document.getElementById(`txt-player-${this.id}-name`) as HTMLInputElement;
        return txtPlayerName.value || txtPlayerName.placeholder;
    }
}