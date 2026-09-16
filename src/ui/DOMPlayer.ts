import {PlayerColor} from "../PlayerColor.js";
import {MainUI} from "./MainUI.js";

export class DOMPlayer {
    public id: number;
    public name: string = "";
    public color: PlayerColor | null = null;

    constructor(id: number) {
        this.id = id;
    }

    public getDomElement(): HTMLElement {
        let div = document.createElement("div");
        div.id = "player" + this.id;

        let textBox = document.createElement("input");
        textBox.id = `txtPlayer${this.id}Name`;
        textBox.type = "text";
        div.appendChild(textBox);

        let colorPicker = document.getElementById("color-picker-template")?.cloneNode(true) as HTMLElement;
        colorPicker.id = "colorPicker" + this.id;
        colorPicker.style.display = "initial";
        div.appendChild(colorPicker);

        let removePlayer = document.createElement("button");
        removePlayer.id = "removePlayer" + this.id;
        removePlayer.addEventListener("click", () => {
            if (MainUI.playersCount <= 2) {
                alert("Almeno due giocatori sono necessari");
                return;
            }
            div.remove();
            MainUI.onRemovePlayer(this.id);
        });
        removePlayer.innerHTML = "X";
        div.appendChild(removePlayer);

        return div;
    }
}