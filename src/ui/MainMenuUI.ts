import {DOMPlayer} from "./DOMPlayer.js";
import {ALL_PLAYER_COLORS, PlayerColor} from "../PlayerColor.js";
import {Game} from "../Game.js";
import {playScreenUI} from "./PlayScreenUI.js";

class MainMenuUI {
    private startScreen = document.getElementById("start-screen");
    private playScreen = document.getElementById("play-screen");
    private btnStartGame = document.getElementById("btn-start");
    private btnAddPlayer = document.getElementById("btn-add-player");
    private playersList = document.getElementById("players-list");
    private inputYears = document.getElementById("input-years") as HTMLInputElement;

    private domPlayers: (DOMPlayer | null)[] = new Array(6).fill(null);

    private get playersCount() {
        let count = 0;
        for (const domPlayer of this.domPlayers) {
            if (domPlayer !== null)
                count++;
        }
        return count;
    };

    constructor() {
        this.btnStartGame?.addEventListener("click", () => {
            let years = parseInt(!this.inputYears.value ? this.inputYears.placeholder : this.inputYears.value);
            if (years < 1 || years > 99) {
                alert("Years must be between 1 and 99");
                return;
            }
            let playingPlayers: DOMPlayer[] = [];
            for (const domPlayer of this.domPlayers) {
                if (domPlayer === null)
                    continue;
                if (domPlayer.color === null) {
                    alert("Some players haven't chosen a color");
                    return;
                }
                //Returns true for null, undefined and "". Since getName() trims the input, it also checks for spaces only names
                if (!domPlayer.getName()) {
                    alert("Detected empty names for some player(s)");
                    return;
                }
                if (playingPlayers.some(otherDomPlayer => otherDomPlayer.getName() === domPlayer.getName())) {
                    alert("Detected equal names for some player(s)");
                    return;
                }
                playingPlayers.push(domPlayer);
            }
            for (const domPlayer of playingPlayers) {
                domPlayer.player = Game.addPlayer(domPlayer.getName(), domPlayer.color!);
            }
            Game.init(years);
            this.startScreen?.classList.add("d-none");
            this.playScreen?.classList.remove("d-none");
            playScreenUI.render();
        });
        this.btnAddPlayer?.addEventListener("click", () => {
            if (this.playersCount < 6)
                this.addPlayer();
            else
                alert("Player limit reached");
        });
        this.addPlayer();
        this.addPlayer();
    }

    private addPlayer() {
        if (this.playersCount >= 6)
            throw new Error("Players limit reached");
        let firstAvailableSlot = 0;
        for (let i = 0; i < 6; i++) {
            if (this.domPlayers[i] === null) {
                firstAvailableSlot = i;
                break;
            }
        }
        let player = new DOMPlayer(firstAvailableSlot);
        this.domPlayers[firstAvailableSlot] = player;
        // Arrow functions: passing this.updateColorGrid directly would make the method lose its this
        this.playersList?.appendChild(player.createDOMElement(() => this.updateColorGrid(), (id) => this.tryRemovePlayer(id)));
        this.updateColorGrid();
    }

    private tryRemovePlayer(id: number): boolean {
        if (this.playersCount <= 2)
            return false;
        this.domPlayers[id] = null;
        this.updateColorGrid();
        return true;
    }

    private updateColorGrid() {
        document.querySelectorAll<HTMLInputElement>(`.color-picker-circle`).forEach((circle: HTMLInputElement) => {
            circle.disabled = false;
        });
        for (const color of ALL_PLAYER_COLORS) {
            let playerWithColor: DOMPlayer | null = null;
            for (const domPlayer of this.domPlayers) {
                if (domPlayer?.color !== color)
                    continue;
                playerWithColor = domPlayer;
                break;
            }
            if (playerWithColor === null)
                continue;
            document.querySelectorAll<HTMLInputElement>(`.color-picker-circle[data-color="${PlayerColor[color]}"]`).forEach((circle: HTMLInputElement) => {
                if (playerWithColor !== null && playerWithColor.domElement?.contains(circle))
                    return;
                circle.disabled = true;
            });
        }
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const mainMenuUI = new MainMenuUI();
