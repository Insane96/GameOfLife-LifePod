export class HouseRule {
    private _value: boolean;

    constructor(public readonly name: string, public readonly description: string, defaultValue: boolean) {
        this._value = defaultValue;
    }

    public get() {
        return this._value;
    }
}

export class HouseRules {
    public static UnlimitedKids: HouseRule = new HouseRule("Unlimited Kids", "Allow players to have unlimited kids instead of the default maximum 9", false);
    public static BalancedRolling: HouseRule = new HouseRule("Balanced Rolling", "Makes rolls lean towards the median instead of a balanced 1~10 roll. This also changes car bonuses to actually be a +1/+2 bonus", false);
    public static LotteryPlayedRoundsBonusOnNoWinner: HouseRule = new HouseRule("Lottery Played Rounds Bonus On No Winner", "The lottery pot will increase (when no winner is chosen) by an higher amount the more years played (by default, the increase is always 20k per miss)", false);
}