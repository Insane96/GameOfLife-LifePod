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

        let textBox = document.createElement("input");
        textBox.id = `txt-player-${this.id}-name`;
        textBox.type = "text";
        textBox.placeholder = "Giocatore " + (this.id + 1);
        textBox.ariaLabel = "Nome giocatore " + (this.id + 1);
        div.appendChild(textBox);

        let colorPicker = document.getElementById("color-picker-template")?.cloneNode(true) as HTMLElement;
        colorPicker.id = "player-color-picker-" + this.id;
        colorPicker.classList.remove("color-picker-template");
        colorPicker.classList.add("color-picker");
        colorPicker.style.display = "initial";
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
        removePlayer.addEventListener("click", () => {
            if (!onTryRemove(this.id)) {
                alert("Almeno due giocatori sono necessari");
                return;
            }
            div.remove();
        });
        removePlayer.textContent = "X";
        removePlayer.ariaLabel = "Rimuovi giocatore";
        div.appendChild(removePlayer);

        this._domElement = div;
        return div;
    }

    public getName(): string {
        return (document.getElementById(`txt-player-${this.id}-name`) as HTMLInputElement).value;
    }
}