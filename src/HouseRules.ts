export class HouseRule {
    private _value: boolean;

    constructor(public readonly name: string, public readonly description: string, defaultValue: boolean) {
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

    public static UnlimitedKids: HouseRule = HouseRules.register(new HouseRule("Unlimited kids", "Allow players to have unlimited kids instead of the default maximum 9", false));
    public static BalancedRolling: HouseRule = HouseRules.register(new HouseRule("Balanced rolling", "Makes rolls lean towards the median instead of a balanced 1~10 roll. This also changes car bonuses to actually be a +1/+2 bonus", false));
    public static LotteryPotBonusOnNoWinnerYearsPlayedBased: HouseRule = HouseRules.register(new HouseRule("Lottery pot bonus on no winner years played-based", "The lottery pot will increase (when no winner is chosen) by an higher amount the more years played (by default, the increase is always 20k per miss)", false));

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