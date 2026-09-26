import {DOMPlayer} from "./DOMPlayer.js";
import {ALL_PLAYER_COLORS, PlayerColor} from "../PlayerColor.js";
import {game} from "../Game.js";
import {playScreenUI} from "./PlayScreenUI.js";
import {globalUI} from "./GlobalUI.js";

class MainMenuUI {
    private startScreen = document.getElementById("start-screen");
    private playScreen = document.getElementById("play-screen");
    private btnStartGame = document.getElementById("btn-start") as HTMLButtonElement;
    private btnAddPlayer = document.getElementById("btn-add-player") as HTMLButtonElement;
    private playersList = document.getElementById("players-list");
    private inputYears = document.getElementById("input-years") as HTMLInputElement;
    private menuError = document.getElementById("menu-error") as HTMLDivElement;

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
        this.btnStartGame.addEventListener("click", () => {
            this.clearError();
            let years = parseInt(!this.inputYears.value ? this.inputYears.placeholder : this.inputYears.value);
            if (years < 1 || years > 99) {
                this.showError("Years must be between 1 and 99");
                return;
            }
            let playingPlayers: DOMPlayer[] = [];
            for (const domPlayer of this.domPlayers) {
                if (domPlayer === null)
                    continue;
                if (domPlayer.color === null) {
                    this.showError("Some players haven't chosen a color");
                    return;
                }
                //Spaces only names aren't valid
                if (!domPlayer.getName().trim()) {
                    this.showError("Detected empty or invalid names for some player(s)");
                    return;
                }
                if (playingPlayers.some(otherDomPlayer => otherDomPlayer.getName() === domPlayer.getName())) {
                    this.showError("Detected equal names for some player(s)");
                    return;
                }
                playingPlayers.push(domPlayer);
            }
            for (const domPlayer of playingPlayers) {
                domPlayer.player = game.addPlayer(domPlayer.getName(), domPlayer.color!);
            }
            game.init(years);
            this.startScreen?.classList.add("d-none");
            this.playScreen?.classList.remove("d-none");
            playScreenUI.render();
            globalUI.render();
        });
        this.btnAddPlayer.addEventListener("click", () => {
            this.clearError();
            if (this.playersCount < 6)
                this.addPlayer();
            else
                this.showError("Player limit reached");
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
        const firstFreeColor = ALL_PLAYER_COLORS.find(color => !this.domPlayers.some(domPlayer => domPlayer?.color === color));
        if (firstFreeColor !== undefined)
            player.selectColor(firstFreeColor);
        this.updateColorGrid();
    }

    private tryRemovePlayer(id: number): boolean {
        this.clearError();
        if (this.playersCount <= 2) {
            this.showError("At least two players are required");
            return false;
        }
        this.domPlayers[id] = null;
        this.updateColorGrid();
        return true;
    }

    private showError(message: string) {
        this.menuError.textContent = message;
        this.menuError.classList.remove("d-none");
    }

    private clearError() {
        this.menuError.classList.add("d-none");
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
