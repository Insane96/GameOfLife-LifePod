import type {TranslationKey} from "./i18n/en.js";

/**
 * An error the player can actually run into (a value out of range, a lottery number already
 * taken, ...), thrown by the models with a translation key instead of display text: the models
 * never know the language, the UI translates it (see PlayScreenUI.onError). Errors that only a
 * bug can trigger (unknown asset id, unsupported save version, ...) stay plain English Errors.
 */
export class GameError extends Error {
    constructor(public readonly key: TranslationKey, public readonly params: Record<string, string | number> = {}) {
        // The key (and params) as the message, for the console
        super(Object.keys(params).length > 0 ? `${key} ${JSON.stringify(params)}` : key);
        this.name = "GameError";
    }
}
