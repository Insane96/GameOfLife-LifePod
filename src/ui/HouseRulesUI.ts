import {HouseRules} from "../HouseRules.js";
import {persistence} from "../Persistence.js";

/**
 * Wraps #house-rules-modal (see CLAUDE.md "Modals"): the rows are built once here from
 * HouseRules.HouseRules (the static structure - the modal chrome - stays in index.html, only the
 * per-rule content is generated, see "HTML vs TS" in CLAUDE.md). Each checkbox is independent, so
 * a toggle updates only its own HouseRule instead of re-rendering the whole list.
 */
class HouseRulesUI {
    private houseRulesList = document.getElementById("house-rules-list") as HTMLDivElement;

    constructor() {
        persistence.loadHouseRules();
        this.buildList();
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
            title.textContent = houseRule.name;

            const description = document.createElement("span");
            description.className = "text-body-secondary small";
            description.textContent = houseRule.description;

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
