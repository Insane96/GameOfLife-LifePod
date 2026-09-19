import {DOMPlayer} from "./DOMPlayer.js";
import {ALL_PLAYER_COLORS, PlayerColor} from "../PlayerColor.js";

export class MainUI {
    static startScreen = document.getElementById("start-screen");
    static btnStartGame = document.getElementById("btn-start");
    static btnAddPlayer = document.getElementById("btn-add-player");
    static playersList = document.getElementById("players-list");

    static domPlayers: (DOMPlayer | null)[] = new Array(6).fill(null);

    public static get playersCount() {
        let count = 0;
        for (const domPlayer of MainUI.domPlayers) {
            if (domPlayer !== null)
                count++;
        }
        return count;
    };

    public static init() {
        MainUI.btnStartGame?.addEventListener("click", () => {

        });
        MainUI.btnAddPlayer?.addEventListener("click", () => {
            if (MainUI.playersCount < 6)
                MainUI.addPlayer();
            else
                alert("Limite di giocatori raggiunto");
        });
        MainUI.addPlayer();
        MainUI.addPlayer();
    }

    public static addPlayer() {
        if (MainUI.playersCount >= 6)
            throw new Error("Players limit reached");
        let firstAvailableSlot = 0;
        for (let i = 0; i < 6; i++) {
            if (this.domPlayers[i] === null) {
                firstAvailableSlot = i;
                break;
            }
        }
        let player = new DOMPlayer(firstAvailableSlot);
        MainUI.domPlayers[firstAvailableSlot] = player;
        MainUI.playersList?.appendChild(player.createDOMElement(MainUI.updateColorGrid, MainUI.tryRemovePlayer));
        MainUI.updateColorGrid();
    }

    public static tryRemovePlayer(id: number): boolean {
        if (MainUI.playersCount <= 2)
            return false;
        MainUI.domPlayers[id] = null;
        return true;
    }

    public static updateColorGrid() {
        document.querySelectorAll<HTMLInputElement>(`.color-picker-circle`).forEach((circle: HTMLInputElement) => {
            circle.disabled = false;
        });
        for (const color of ALL_PLAYER_COLORS) {
            let playerWithColor: DOMPlayer | null = null;
            for (const domPlayer of MainUI.domPlayers) {
                let checkedCircle = domPlayer?.domElement?.querySelector<HTMLInputElement>(`input[name="player-color-${domPlayer.id}"]:checked`);
                if (checkedCircle === null || checkedCircle === undefined)
                    continue;
                let circleColor = PlayerColor[checkedCircle.dataset.color as keyof typeof PlayerColor];
                if (circleColor !== color)
                    continue;
                playerWithColor = domPlayer;
                break;
            }
            if (playerWithColor === null)
                continue;
            document.querySelectorAll<HTMLInputElement>(`.color-picker-circle[data-color="${PlayerColor[color]}"]`).forEach((circle: HTMLInputElement) => {
                if (playerWithColor !== null && parseInt(circle.id.split("-")[3]) == playerWithColor.id)
                    return;
                circle.disabled = true;
            });
        }
    }
}

MainUI.init();