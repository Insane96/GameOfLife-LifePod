import {game, GameSave} from "./Game.js";
import {lottery, LotterySave} from "./Lottery.js";
import {HouseRules} from "./HouseRules.js";

const SAVE_KEY = "lifepod.save";
const PREVIOUS_KEY = "lifepod.save.previous";
const HOUSE_RULES_KEY = "lifepod.houserules";
const VERSION = 1;

interface SaveEnvelope {
    version: number;
    game: GameSave;
    lottery: LotterySave;
}

class Persistence {
    // Mirrors whatever was last written to SAVE_KEY, so save() can tell a real model change from
    // a render() triggered by something that didn't touch the model (e.g. opening an input field):
    // only a real change is worth shifting into PREVIOUS_KEY as an undo point.
    private lastSaved: string | null = null;

    /**
     * Writes the current game+lottery state, keeping whatever was there before as the one-step
     * undo point (see undo()). A no-op when nothing actually changed since the last save.
     */
    public save(): void {
        let serialized: string;
        try {
            const envelope: SaveEnvelope = {version: VERSION, game: game.toJSON(), lottery: lottery.toJSON()};
            serialized = JSON.stringify(envelope);
        }
        catch (e) {
            console.error("Failed to serialize the game state", e);
            return;
        }
        if (serialized === this.lastSaved)
            return;
        try {
            const current = localStorage.getItem(SAVE_KEY);
            if (current !== null)
                localStorage.setItem(PREVIOUS_KEY, current);
            localStorage.setItem(SAVE_KEY, serialized);
            this.lastSaved = serialized;
        }
        catch (e) {
            console.error("Failed to save the game (storage unavailable?)", e);
        }
    }

    /**
     * Raw access to the current save, for the JSON save editor (SaveEditorUI). Bypasses the
     * model entirely: unlike load()/save(), the caller is responsible for whatever it writes.
     */
    public getRaw(): string | null {
        try {
            return localStorage.getItem(SAVE_KEY);
        }
        catch {
            return null;
        }
    }

    /**
     * Overwrites the save with an arbitrary string, used by the save editor. Shifts the previous
     * content into the undo slot like save() does, but skips model validation entirely: the
     * editor only checks the text is valid JSON, not that it matches the Game/Player/Lottery
     * shape (the existing load() path already reports and clears a broken save).
     */
    public setRaw(raw: string): void {
        try {
            const current = localStorage.getItem(SAVE_KEY);
            if (current !== null)
                localStorage.setItem(PREVIOUS_KEY, current);
            localStorage.setItem(SAVE_KEY, raw);
            this.lastSaved = raw;
        }
        catch (e) {
            console.error("Failed to save the edited game (storage unavailable?)", e);
        }
    }

    public hasSavedGame(): boolean {
        try {
            return localStorage.getItem(SAVE_KEY) !== null;
        }
        catch {
            return false;
        }
    }

    public canUndo(): boolean {
        try {
            return localStorage.getItem(PREVIOUS_KEY) !== null;
        }
        catch {
            return false;
        }
    }

    /**
     * Loads the current save into the game/lottery singletons. Returns false (and clears the
     * broken save) if there was nothing to load or it couldn't be applied.
     */
    public load(): boolean {
        let raw: string | null;
        try {
            raw = localStorage.getItem(SAVE_KEY);
        }
        catch {
            return false;
        }
        if (raw === null)
            return false;
        return this.applyRaw(raw);
    }

    /**
     * Restores the one saved snapshot before the current one, undoing the last action. Single
     * level: PREVIOUS_KEY is consumed (removed) so a second Undo does nothing until a new action
     * creates a fresh undo point.
     */
    public undo(): boolean {
        let raw: string | null;
        try {
            raw = localStorage.getItem(PREVIOUS_KEY);
        }
        catch {
            return false;
        }
        if (raw === null)
            return false;
        try {
            localStorage.setItem(SAVE_KEY, raw);
            localStorage.removeItem(PREVIOUS_KEY);
        }
        catch (e) {
            console.error("Failed to undo (storage unavailable?)", e);
            return false;
        }
        return this.applyRaw(raw);
    }

    /**
     * Discards the saved game entirely (both the current and the undo snapshot). Used only when
     * the player confirms starting a new game over an existing save: otherwise PREVIOUS_KEY would
     * still hold the abandoned game, and Undo would resurrect it into the new one.
     */
    public wipe(): void {
        try {
            localStorage.removeItem(SAVE_KEY);
            localStorage.removeItem(PREVIOUS_KEY);
        }
        catch (e) {
            console.error("Failed to wipe the saved game (storage unavailable?)", e);
        }
        this.lastSaved = null;
    }

    /**
     * House rules are a setting, not part of the game state: own key, no undo point, and not
     * touched by wipe()/reset() so they survive across games.
     */
    public saveHouseRules(): void {
        try {
            localStorage.setItem(HOUSE_RULES_KEY, JSON.stringify(HouseRules.toJSON()));
        }
        catch (e) {
            console.error("Failed to save the house rules (storage unavailable?)", e);
        }
    }

    public loadHouseRules(): void {
        let raw: string | null;
        try {
            raw = localStorage.getItem(HOUSE_RULES_KEY);
        }
        catch {
            return;
        }
        if (raw === null)
            return;
        try {
            HouseRules.loadFromJSON(JSON.parse(raw));
        }
        catch (e) {
            console.error("Failed to load the house rules, ignoring", e);
        }
    }

    private applyRaw(raw: string): boolean {
        try {
            const envelope: SaveEnvelope = JSON.parse(raw);
            if (envelope.version !== VERSION)
                throw new Error(`Unsupported save version ${envelope.version}`);
            game.loadFromJSON(envelope.game);
            lottery.loadFromJSON(envelope.lottery, game.players);
            this.lastSaved = raw;
            return true;
        }
        catch (e) {
            console.error("Failed to load the saved game, clearing it", e);
            this.wipe();
            return false;
        }
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const persistence = new Persistence();
