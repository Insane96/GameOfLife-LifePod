class GlobalUI {
    private btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;

    constructor() {
        if (!document.documentElement.requestFullscreen)
            this.btnFullscreen.classList.add("d-none");

        this.btnFullscreen.addEventListener("click", () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().then(() => this.btnFullscreen.ariaLabel = "Enter fullscreen");

            }
            else {
                document.documentElement.requestFullscreen().then(() => this.btnFullscreen.ariaLabel = "Exit fullscreen");
            }
        });
        document.addEventListener("fullscreenchange", () => {

        })
    }

}

// Singleton: the module is executed only once, so this is the only instance.
export const globalUI = new GlobalUI();