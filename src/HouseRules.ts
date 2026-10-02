// An identifier, not display text: HouseRulesUI translates it into the rule's name and description.
export type HouseRuleId = "unlimitedKids" | "balancedRolling" | "lotteryPotBonusYearsPlayedBased";

export class HouseRule {
    private _value: boolean;

    constructor(public readonly id: HouseRuleId, defaultValue: boolean) {
        this._value = defaultValue;
    }

    public get() {
        return this._value;
    }

    public set(value: boolean) {
        this._value = value;
    }
}

export class HouseRules {
    public static readonly HouseRules: HouseRule[] = [];

    public static UnlimitedKids: HouseRule = HouseRules.register(new HouseRule("unlimitedKids", false));
    public static BalancedRolling: HouseRule = HouseRules.register(new HouseRule("balancedRolling", false));
    public static LotteryPotBonusOnNoWinnerYearsPlayedBased: HouseRule = HouseRules.register(new HouseRule("lotteryPotBonusYearsPlayedBased", false));

    private static register(houseRule: HouseRule) {
        HouseRules.HouseRules.push(houseRule);
        return houseRule;
    }

    // Serialized as a plain array of values, positional (indices into HouseRules.HouseRules),
    // same approach as Lottery's player-keyed fields (see CLAUDE.md "Persistence").
    public static toJSON(): boolean[] {
        return HouseRules.HouseRules.map(houseRule => houseRule.get());
    }

    public static loadFromJSON(values: boolean[]) {
        values.forEach((value, index) => HouseRules.HouseRules[index]?.set(value));
    }
}