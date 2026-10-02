import {sounds} from "./Sounds.js";
import {i18n, t} from "../i18n/I18n.js";

class GlobalUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    private btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;
    private iconFullscreen = document.getElementById("icon-fullscreen") as HTMLElement;
    private cellSettings = document.getElementById("cell-settings") as HTMLDivElement;
    private startScreenSettings = document.getElementById("start-screen-settings") as HTMLDivElement;
    private volumeControl = document.getElementById("volume-control") as HTMLDivElement;
    private inputVolume = document.getElementById("input-volume") as HTMLInputElement;
    private inputLanguage = document.getElementById("input-language") as HTMLSelectElement;

    constructor() {
        if (!document.documentElement.requestFullscreen)
            this.btnFullscreen.classList.add("d-none");

        this.inputVolume.addEventListener("input", () => sounds.setVolume(parseFloat(this.inputVolume.value)));

        // Key press beep, like the original device. A single delegated listener covers every
        // button, including dynamic ones; disabled buttons fire no click, and Enter in the numeric
        // fields goes through the confirm button's click(), so it beeps too.
        document.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("button") !== null)
                sounds.play("beep");
        });

        this.btnFullscreen.addEventListener("click", () => {
            if (document.fullscreenElement)
                document.exitFullscreen().catch((err) => alert(err));
            else
                document.documentElement.requestFullscreen().catch((err) => alert(err));
        });
        document.addEventListener("fullscreenchange", () => this.render());

        this.inputLanguage.addEventListener("change", () => {
            if (i18n.isLanguage(this.inputLanguage.value))
                i18n.setLanguage(this.inputLanguage.value);
        });
        i18n.addLanguageChangeListener(() => this.render());
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

        this.inputLanguage.value = i18n.getLanguage();
        this.translateStaticTexts();

        // Re-rendered from the fullscreenchange event, not from the click: the user can also leave
        // fullscreen with Esc or a system gesture.
        if (document.fullscreenElement) {
            this.btnFullscreen.ariaLabel = t("fullscreen.exit");
            this.iconFullscreen.classList.replace("bi-arrows-fullscreen", "bi-fullscreen-exit");
        }
        else {
            this.btnFullscreen.ariaLabel = t("fullscreen.enter");
            this.iconFullscreen.classList.replace("bi-fullscreen-exit", "bi-arrows-fullscreen");
        }
    }

    // The static texts of index.html carry their key in data-i18n (textContent), data-i18n-aria-label
    // and data-i18n-placeholder; the English text written in the HTML stays as the fallback for an
    // unknown key. Covers the whole document, so cloned elements (the color picker) are included too.
    private translateStaticTexts() {
        this.translateAll("data-i18n", (element, text) => element.textContent = text);
        this.translateAll("data-i18n-aria-label", (element, text) => element.ariaLabel = text);
        this.translateAll("data-i18n-placeholder", (element, text) => element.setAttribute("placeholder", text));
    }

    private translateAll(attribute: string, apply: (element: Element, text: string) => void) {
        document.querySelectorAll(`[${attribute}]`).forEach(element => {
            const key = element.getAttribute(attribute) ?? "";
            if (i18n.isTranslationKey(key))
                apply(element, t(key));
            else
                console.warn(`Unknown translation key "${key}" in ${attribute}`);
        });
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const globalUI = new GlobalUI();