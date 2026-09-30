import {sounds} from "./Sounds.js";

class GlobalUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    private btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;
    private iconFullscreen = document.getElementById("icon-fullscreen") as HTMLElement;
    private cellSettings = document.getElementById("cell-settings") as HTMLDivElement;
    private startScreenSettings = document.getElementById("start-screen-settings") as HTMLDivElement;
    private volumeControl = document.getElementById("volume-control") as HTMLDivElement;
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
        // Which screen is actually visible, not game.gameStarted: "Back to menu" (PlayScreenUI)
        // can show the start screen again without resetting the game, so the two can diverge.
        if (!this.playScreen.classList.contains("d-none")) {
            this.cellSettings.appendChild(this.btnFullscreen);
            this.cellSettings.appendChild(this.volumeControl);
        }
        else {
            this.startScreenSettings.appendChild(this.btnFullscreen);
            this.startScreenSettings.appendChild(this.volumeControl);
        }
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const globalUI = new GlobalUI();