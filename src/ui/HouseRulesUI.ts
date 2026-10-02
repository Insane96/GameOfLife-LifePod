import {HouseRuleId, HouseRules} from "../HouseRules.js";
import {persistence} from "../Persistence.js";
import {i18n, t} from "../i18n/I18n.js";
import type {TranslationKey} from "../i18n/en.js";

// Record: a new HouseRule added without a translation is a compile error.
const HOUSE_RULE_KEYS: Record<HouseRuleId, {name: TranslationKey, description: TranslationKey}> = {
    "unlimitedKids": {name: "houseRule.unlimitedKids", description: "houseRule.unlimitedKids.description"},
    "balancedRolling": {name: "houseRule.balancedRolling", description: "houseRule.balancedRolling.description"},
    "lotteryPotBonusYearsPlayedBased": {name: "houseRule.lotteryPotBonus", description: "houseRule.lotteryPotBonus.description"},
};

/**
 * Wraps #house-rules-modal (see CLAUDE.md "Modals"): the rows are built once here from
 * HouseRules.HouseRules (the static structure - the modal chrome - stays in index.html, only the
 * per-rule content is generated, see "HTML vs TS" in CLAUDE.md). Each checkbox is independent, so
 * a toggle updates only its own HouseRule instead of re-rendering the whole list. Only the texts
 * are rewritten on a language change (see translate()).
 */
class HouseRulesUI {
    private houseRulesList = document.getElementById("house-rules-list") as HTMLDivElement;
    private texts: {id: HouseRuleId, title: HTMLSpanElement, description: HTMLSpanElement}[] = [];

    constructor() {
        persistence.loadHouseRules();
        this.buildList();
        this.translate();
        i18n.addLanguageChangeListener(() => this.translate());
    }

    private translate() {
        for (const {id, title, description} of this.texts) {
            title.textContent = t(HOUSE_RULE_KEYS[id].name);
            description.textContent = t(HOUSE_RULE_KEYS[id].description);
        }
    }

    private buildList() {
        HouseRules.HouseRules.forEach((houseRule, index) => {
            const row = document.createElement("div");
            row.className = "form-check";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = `house-rule-${index}`;
            checkbox.checked = houseRule.get();
            checkbox.addEventListener("change", () => {
                houseRule.set(checkbox.checked);
                persistence.saveHouseRules();
            });

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = checkbox.id;

            const title = document.createElement("span");
            title.className = "fw-semibold d-block";

            const description = document.createElement("span");
            description.className = "text-body-secondary small";
            this.texts.push({id: houseRule.id, title, description});

            label.appendChild(title);
            label.appendChild(description);
            row.appendChild(checkbox);
            row.appendChild(label);
            this.houseRulesList.appendChild(row);
        });
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const houseRulesUI = new HouseRulesUI();
