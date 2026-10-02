import {en, TranslationKey} from "./en.js";
import {it} from "./it.js";

export type Language = "en" | "it";

const LANGUAGE_KEY = "lifepod.lang";

const dictionaries: Record<Language, Partial<Record<TranslationKey, string>>> = {en, it};
const locales: Record<Language, string> = {en: "en-US", it: "it-IT"};

class I18n {
    private language: Language;
    private languageChangeListeners: (() => void)[] = [];

    constructor() {
        this.language = this.loadLanguage();
        document.documentElement.lang = this.language;
    }

    public getLanguage(): Language {
        return this.language;
    }

    // For toLocaleString, so number formatting follows the language too.
    public getLocale(): string {
        return locales[this.language];
    }

    public isLanguage(value: string): value is Language {
        // Not "value in dictionaries": that is also true for inherited names like "toString".
        return Object.keys(dictionaries).includes(value);
    }

    // For keys that come from outside the type system, like the data-i18n attributes in index.html.
    public isTranslationKey(value: string): value is TranslationKey {
        return Object.keys(en).includes(value);
    }

    public setLanguage(language: Language) {
        this.language = language;
        document.documentElement.lang = language;
        // A preference, not part of the game: lifepod.save and Undo never touch it.
        // Storage can be unavailable (private window, blocked site data): the language just isn't remembered.
        try {
            localStorage.setItem(LANGUAGE_KEY, language);
        }
        catch {
        }
        this.languageChangeListeners.forEach(listener => listener());
    }

    // Screens register their render() here, so a language change re-renders them.
    public addLanguageChangeListener(listener: () => void) {
        this.languageChangeListeners.push(listener);
    }

    // Placeholders in the text are written as {name} and replaced from params; unknown ones are left as-is.
    public t(key: TranslationKey, params: Record<string, string | number> = {}): string {
        const text = dictionaries[this.language][key] ?? en[key];
        return text.replace(/\{(\w+)}/g, (placeholder, name: string) =>
            name in params ? String(params[name]) : placeholder);
    }

    private loadLanguage(): Language {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(LANGUAGE_KEY);
        }
        catch {
        }
        if (saved !== null && this.isLanguage(saved))
            return saved;
        // First launch: follow the browser ("it", "it-IT", "it-CH", ... all map to Italian).
        const browserLanguage = navigator.language.split("-")[0];
        return this.isLanguage(browserLanguage) ? browserLanguage : "en";
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const i18n = new I18n();

// Shorthand used by the UI: t("key") instead of i18n.t("key").
export const t = (key: TranslationKey, params?: Record<string, string | number>) => i18n.t(key, params);
