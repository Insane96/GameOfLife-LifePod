import {PlayerColor} from "../PlayerColor.js";
import {Player} from "../Player.js";

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
        div.classList.add("d-flex", "flex-wrap", "justify-content-center", "align-items-center", "gap-2", "m-1");

        let textBox = document.createElement("input");
        textBox.id = `txt-player-${this.id}-name`;
        textBox.type = "text";
        // w-auto: form-control is width: 100% by default, which would fill the whole row
        textBox.classList.add("form-control", "w-auto");
        textBox.placeholder = "Player " + (this.id + 1);
        textBox.ariaLabel = "Player " + (this.id + 1) + " name";
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
                this.color = PlayerColor[circle.dataset.color as keyof typeof PlayerColor];
                updateColorGrid();
            })
        });
        div.appendChild(colorPicker);

        let removePlayer = document.createElement("button");
        removePlayer.id = "btn-remove-player-" + this.id;
        removePlayer.classList.add("btn", "btn-outline-danger", "btn-sm");
        removePlayer.addEventListener("click", () => {
            if (!onTryRemove(this.id)) {
                alert("At least two players are required");
                return;
            }
            div.remove();
        });
        removePlayer.textContent = "X";
        removePlayer.ariaLabel = "Remove player";
        // Placed before the name, so it stays in the first row when the colors wrap
        div.insertBefore(removePlayer, textBox);

        this._domElement = div;
        return div;
    }

    public getName(): string {
        let txtPlayerName = document.getElementById(`txt-player-${this.id}-name`) as HTMLInputElement;
        return txtPlayerName.value.trim();
    }
}