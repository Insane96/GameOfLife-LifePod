import {DOMPlayer} from "./DOMPlayer.js";
import {ALL_PLAYER_COLORS, PlayerColor} from "../PlayerColor.js";
import {Game} from "../Game.js";

export class MainMenuUI {
    static startScreen = document.getElementById("start-screen");
    static playScreen = document.getElementById("play-screen");
    static btnStartGame = document.getElementById("btn-start");
    static btnAddPlayer = document.getElementById("btn-add-player");
    static playersList = document.getElementById("players-list");
    static inputYears = document.getElementById("input-years") as HTMLInputElement;

    static domPlayers: (DOMPlayer | null)[] = new Array(6).fill(null);

    public static get playersCount() {
        let count = 0;
        for (const domPlayer of MainMenuUI.domPlayers) {
            if (domPlayer !== null)
                count++;
        }
        return count;
    };

    public static init() {
        MainMenuUI.btnStartGame?.addEventListener("click", () => {
            Game.init(Number(MainMenuUI.inputYears.value));
            for (const domPlayer of MainMenuUI.domPlayers) {
                if (domPlayer === null)
                    continue;
                if (domPlayer.color === null)
                    continue;
                domPlayer.player = Game.addPlayer(domPlayer.getName(), domPlayer.color);
                MainMenuUI.startScreen?.classList.add("d-none");
                MainMenuUI.playScreen?.classList.remove("d-none");
            }
        });
        MainMenuUI.btnAddPlayer?.addEventListener("click", () => {
            if (MainMenuUI.playersCount < 6)
                MainMenuUI.addPlayer();
            else
                alert("Limite di giocatori raggiunto");
        });
        MainMenuUI.addPlayer();
        MainMenuUI.addPlayer();
    }

    public static addPlayer() {
        if (MainMenuUI.playersCount >= 6)
            throw new Error("Players limit reached");
        let firstAvailableSlot = 0;
        for (let i = 0; i < 6; i++) {
            if (this.domPlayers[i] === null) {
                firstAvailableSlot = i;
                break;
            }
        }
        let player = new DOMPlayer(firstAvailableSlot);
        MainMenuUI.domPlayers[firstAvailableSlot] = player;
        MainMenuUI.playersList?.appendChild(player.createDOMElement(MainMenuUI.updateColorGrid, MainMenuUI.tryRemovePlayer));
        MainMenuUI.updateColorGrid();
    }

    public static tryRemovePlayer(id: number): boolean {
        if (MainMenuUI.playersCount <= 2)
            return false;
        MainMenuUI.domPlayers[id] = null;
        MainMenuUI.updateColorGrid();
        return true;
    }

    public static updateColorGrid() {
        document.querySelectorAll<HTMLInputElement>(`.color-picker-circle`).forEach((circle: HTMLInputElement) => {
            circle.disabled = false;
        });
        for (const color of ALL_PLAYER_COLORS) {
            let playerWithColor: DOMPlayer | null = null;
            for (const domPlayer of MainMenuUI.domPlayers) {
                if (domPlayer?.color !== color)
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

MainMenuUI.init();