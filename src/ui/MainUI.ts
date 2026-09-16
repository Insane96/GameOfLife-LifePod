import {DOMPlayer} from "./DOMPlayer.js";

export class MainUI {
    static startScreen = document.getElementById("start-screen");
    static btnStartGame = document.getElementById("start-button");
    static btnAddPlayer = document.getElementById("add-player");
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
        let firstAvailableSlot = 0;
        for (let i = 0; i < 6; i++) {
            if (this.domPlayers[i] === null) {
                firstAvailableSlot = i;
                break;
            }
        }
        let player = new DOMPlayer(firstAvailableSlot);
        MainUI.domPlayers[firstAvailableSlot] = player;
        MainUI.playersList?.appendChild(player.getDomElement());
    }

    public static onRemovePlayer(id: number) {
        this.domPlayers[id] = null;
    }
}

MainUI.init();