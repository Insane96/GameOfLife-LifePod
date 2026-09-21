import {game} from "../Game.js";

class GlobalUI {
    private btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;
    private cellSettings = document.getElementById("cell-settings") as HTMLDivElement;
    private startScreenSettings = document.getElementById("start-screen-settings") as HTMLDivElement;

    constructor() {
        if (!document.documentElement.requestFullscreen)
            this.btnFullscreen.classList.add("d-none");

        this.btnFullscreen.addEventListener("click", () => {
            if (document.fullscreenElement)
                document.exitFullscreen().catch((err) => alert(err));
            else
                document.documentElement.requestFullscreen().catch((err) => alert(err));
        });
        document.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement) {
                this.btnFullscreen.ariaLabel = "Exit fullscreen";
            }
            else {
                this.btnFullscreen.ariaLabel = "Enter fullscreen";
            }
        });
        this.render();
    }

    public render() {
        if (game.gameStarted) {
            this.cellSettings.appendChild(this.btnFullscreen);
        }
        else {
            this.startScreenSettings.appendChild(this.btnFullscreen);
        }
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const globalUI = new GlobalUI();