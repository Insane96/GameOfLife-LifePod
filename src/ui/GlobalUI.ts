import {game} from "../Game.js";
import {sounds} from "./Sounds.js";

class GlobalUI {
    private btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;
    private iconFullscreen = document.getElementById("icon-fullscreen") as HTMLElement;
    private cellSettings = document.getElementById("cell-settings") as HTMLDivElement;
    private startScreenSettings = document.getElementById("start-screen-settings") as HTMLDivElement;
    private inputVolume = document.getElementById("input-volume") as HTMLInputElement;

    constructor() {
        if (!document.documentElement.requestFullscreen)
            this.btnFullscreen.classList.add("d-none");

        this.inputVolume.addEventListener("input", () => sounds.setVolume(parseFloat(this.inputVolume.value)));

        this.btnFullscreen.addEventListener("click", () => {
            if (document.fullscreenElement)
                document.exitFullscreen().catch((err) => alert(err));
            else
                document.documentElement.requestFullscreen().catch((err) => alert(err));
        });
        document.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement) {
                this.btnFullscreen.ariaLabel = "Exit fullscreen";
                this.iconFullscreen.classList.replace("bi-arrows-fullscreen", "bi-fullscreen-exit");
            }
            else {
                this.btnFullscreen.ariaLabel = "Enter fullscreen";
                this.iconFullscreen.classList.replace("bi-fullscreen-exit", "bi-arrows-fullscreen");
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