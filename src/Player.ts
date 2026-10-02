import {PlayerColor} from "./PlayerColor.js";
import {Asset} from "./Asset.js";
import {OwnedAsset, OwnedAssetSave} from "./OwnedAsset.js";
import {HouseRules} from "./HouseRules.js";
import {game} from "./Game.js";
import {GameError} from "./GameError.js";

export interface PlayerSave {
    name: string;
    color: PlayerColor;
    money: number;
    lifePoints: number;
    salary: number;
    married: boolean;
    kids: number;
    qualification: number;
    hasPressedSpin: boolean;
    assets: OwnedAssetSave[];
}

/**
 * One category's contribution to a money/Life Points change (e.g. "salary", "houses"), so the
 * UI can animate/report them one at a time instead of a single lump sum. Plain data: Player stays
 * unaware of how (or whether) the UI displays it.
 */
export type StatStepLabel = "" | "salary" | "rent" | "kids" | "debts" | "houses" | "cars" | "wedding"
    | "anniversary" | "gifts" | "baby" | "twins" | "auction lost" | "auction won";

export interface StatStep {
    // "" for an unlabelled lump sum. An identifier, not display text: the UI translates it.
    label: StatStepLabel;
    amount: number;
}

/**
 * A money/Life Points change broken down into labelled StatSteps, returned by any action whose
 * toast/animation should show what caused the change (Spin, Wedding, Kids, Auction) instead of a
 * single unlabelled lump sum.
 */
export interface StatBreakdown {
    money: StatStep[];
    lifePoints: StatStep[];
}

export class Player {
    private _money: number = 0;
    private _lifePoints: number = 0;
    private _salary: number = 5000;
    private _married: boolean = false;
    private _kids: number = 0;
    private _assets: Array<OwnedAsset> = [];
    private _qualification: Qualification = Qualification.None;

    private _hasPressedSpin: boolean = false;

    constructor(
        public name: string,
        public color: PlayerColor,
    ) { }

    public get hasPressedSpin(): boolean {
        return this._hasPressedSpin;
    }

    public onSpin(): StatBreakdown {
        if (this._hasPressedSpin)
            throw new Error("Player has already pressed Spin");

        // Rent: charged instead of a mortgage/upkeep once the game is a few rounds in, if the
        // player still owns no house.
        let rentPenalty: number = 0;
        if (game.playedRounds >= 3 && !this._assets.some(ownedAsset => ownedAsset.asset.isHouse()))
            rentPenalty = 0.15;
        let kidsPenalty: number = 0;
        if (this._kids > 0) {
            //TODO Track age so they will no longer cost anything @ 18 years
            kidsPenalty = 0.05 + (Math.min(this._kids, 5) * 0.05);
            if (this._kids > 5)
                kidsPenalty += 0.03 * (this._kids - 5);
            if (kidsPenalty > 0.4)
                kidsPenalty = 0.4;
        }
        const rentAmount = this._salary * rentPenalty;
        const kidsAmount = this._salary * kidsPenalty;
        let calculatedSalary: number = this._salary - rentAmount - kidsAmount;
        this.addMoney(calculatedSalary);
        let debtAmount = 0;
        if (this._money < 0) {
            debtAmount = -this._money * 0.10;
            this.removeMoney(debtAmount);
        }

        // costPerTurn/lifePointsPerTurn are fixed per Asset (not per OwnedAsset instance), so they
        // can be summed up-front for the breakdown regardless of what onNewTurn() then does to each
        // OwnedAsset's own _value (appreciation/depreciation/removal).
        let houseCost = 0, carCost = 0, houseLifePoints = 0, carLifePoints = 0;
        for (const asset of this._assets) {
            if (asset.asset.isHouse()) {
                houseCost += asset.asset.costPerTurn;
                houseLifePoints += asset.asset.lifePointsPerTurn;
            }
            else if (asset.asset.isCar()) {
                carCost += asset.asset.costPerTurn;
                carLifePoints += asset.asset.lifePointsPerTurn;
            }
            asset.onNewTurn(this);
        }

        const weddingLifePoints = this._married ? 1500 : 0;
        if (this._married)
            this.addLifePoints(weddingLifePoints);
        const kidsLifePoints = this._kids > 0 ? this._kids * 350 : 0;
        if (kidsLifePoints > 0)
            this.addLifePoints(kidsLifePoints);

        game.roll();
        this._hasPressedSpin = true;

        return {
            money: [
                {label: "salary", amount: this._salary},
                {label: "rent", amount: -rentAmount},
                {label: "kids", amount: -kidsAmount},
                {label: "debts", amount: -debtAmount},
                {label: "houses", amount: -houseCost},
                {label: "cars", amount: -carCost},
            ],
            lifePoints: [
                {label: "houses", amount: houseLifePoints},
                {label: "cars", amount: carLifePoints},
                {label: "wedding", amount: weddingLifePoints},
                {label: "kids", amount: kidsLifePoints},
            ],
        };
    }

    public endTurn() {
        this._hasPressedSpin = false;
    }

    public get money(): number {
        return this._money;
    }

    public addMoney(money: number): void {
        if (Number.isNaN(money))
            throw new Error("money must be a number.");
        if (money <= 0 || money > 2000000)
            throw new GameError("error.moneyRange");
        this._money += money;
        this._money = Math.round(this._money);

    }

    public removeMoney(money: number): void {
        if (Number.isNaN(money))
            throw new Error("money must be a number.");
        if (money <= 0 || money > 2000000)
            throw new GameError("error.moneyRange");
        this._money -= money;
        this._money = Math.round(this._money);
    }

    public get salary(): number {
        return this._salary;
    }

    public set salary(value: number) {
        if (value < 5000 || value > 2000000)
            throw new GameError("error.salaryRange");
        this._salary = value;
    }

    public get lifePoints(): number {
        return this._lifePoints;
    }

    public addLifePoints(lifePoints: number): void {
        if (Number.isNaN(lifePoints))
            throw new Error("lifePoints must be a number.");
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new GameError("error.lifePointsRange");
        this._lifePoints += lifePoints;
        this._lifePoints = Math.round(this._lifePoints);
    }

    public removeLifePoints(lifePoints: number): void {
        if (Number.isNaN(lifePoints))
            throw new Error("lifePoints must be a number.");
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new GameError("error.lifePointsRange");
        this._lifePoints -= lifePoints;
        this._lifePoints = Math.round(this._lifePoints);
    }

    public get married() {
        return this._married;
    }

    public getMarried(): StatBreakdown {
        const label = !this._married ? "wedding" : "anniversary";
        this.addLifePoints(3000);
        let moneyGift: number = !this._married ? 1000 : 500;
        this._married = true;
        let totalGift = 0;
        for (const player of game.players) {
            if (player === this)
                continue;
            player.removeMoney(moneyGift);
            this.addMoney(moneyGift);
            totalGift += moneyGift;
        }
        return {
            money: [{label: "gifts", amount: totalGift}],
            lifePoints: [{label, amount: 3000}],
        };
    }

    public get kids() {
        return this._kids;
    }

    public addKids(kids: number): StatStep[] {
        if (kids < 1 || kids > 2)
            throw new Error("kids must be between 1 or 2");
        if (!HouseRules.UnlimitedKids.get() && this._kids + kids > 9)
            throw new GameError("error.maxKids");
        this._kids += kids;
        const lifePointsGain = kids * 350;
        this.addLifePoints(lifePointsGain);
        return [{label: kids === 1 ? "baby" : "twins", amount: lifePointsGain}];
    }

    /**
     * @returns the Life Points steps from addKids() on a birth, or an empty array if the roll
     * didn't yield one (the caller tells those apart the same way as any other no-op step: by
     * checking whether the array is empty).
     */
    public tryForAKid(): StatStep[] {
        if (!HouseRules.UnlimitedKids.get() && this._kids >= 9)
            throw new GameError("error.maxKids");
        let newBorn = game.rollAndSetChance();
        if (newBorn > 0 && !HouseRules.UnlimitedKids.get() && this._kids + newBorn > 9) {
            newBorn = 1;
            game.rolledChance = 1;
        }
        return newBorn > 0 ? this.addKids(newBorn) : [];
    }

    public buyAsset(asset: Asset) {
        if (this.hasAsset(asset))
            throw new Error("Cannot add asset. Player already has asset");
        this._assets.push(new OwnedAsset(asset));
        this.removeMoney(asset.buyCost);
    }

    public hasAsset(asset: Asset): boolean {
        return this._assets.some(ownedAsset => ownedAsset.asset === asset);
    }

    public getOwnedAsset(asset: Asset): OwnedAsset | undefined {
        return this._assets.find(ownedAsset => ownedAsset.asset === asset);
    }

    public sellAsset(asset: Asset) {
        if (!this.hasAsset(asset))
            throw new Error("Cannot sell asset. Player doesn't have the asset");
        let ownedAsset = this.getOwnedAsset(asset);
        if (ownedAsset === undefined)
            throw new Error("Cannot sell asset. Failed to get OwnedAsset");
        this.addMoney(ownedAsset._value);
        this.removeAsset(asset);
    }

    public sellAllAssets() {
        for (const ownedAsset of this._assets) {
            this.sellAsset(ownedAsset.asset);
        }
    }

    public removeAsset(asset: Asset) {
        this._assets = this._assets.filter(ownedAsset => ownedAsset.asset !== asset);
    }

    public degree() {
        this.addLifePoints(4000);
        if (this._qualification < Qualification.Degree)
            this._qualification = Qualification.Degree;
    }

    public phd() {
        this.addLifePoints(4500);
        if (this._qualification < Qualification.PhD)
            this._qualification = Qualification.PhD;
    }

    /**
     * @returns a single money step describing the outcome ("auction won"/"auction lost"), or an
     * empty array when the bid had no effect (result == 1).
     */
    public bid(amount: number): StatStep[] {
        if (Number.isNaN(amount))
            throw new Error("bid must be a number.");
        if (amount < 10000 || amount > 100000)
            throw new GameError("error.bidRange");
        let result = game.rollAndSetChance();
        //TODO House rule: balanced bid: to win with 1 and 2
        if (result == 0) {
            this.removeMoney(amount);
            return [{label: "auction lost", amount: -amount}];
        }
        if (result == 2) {
            this.addMoney(amount);
            return [{label: "auction won", amount}];
        }
        return [];
    }

    /**
     * Clamps rolls by car. With luxury car you can't roll 1 or 2 and with an economy car you can't roll a 1
     */
    public modifyRollByCar(rolledNumber: number): number {
        if (HouseRules.BalancedRolling.get()) {
            if (this.hasAsset(Asset.LuxuryCar)) return rolledNumber + 2;
            if (this.hasAsset(Asset.EconomyCar)) return rolledNumber + 1;
        }
        else {
            if (this.hasAsset(Asset.LuxuryCar) && rolledNumber < 3) return 3;
            if (this.hasAsset(Asset.EconomyCar) && rolledNumber < 2) return 2;
        }
        return rolledNumber;
    }

    public convertMoneyToLifePoints() {
        this._lifePoints += this._money / game.conversionRatio;
        this._lifePoints = Math.round(this._lifePoints);
        this._money = 0;
    }

    public toJSON(): PlayerSave {
        return {
            name: this.name,
            color: this.color,
            money: this._money,
            lifePoints: this._lifePoints,
            salary: this._salary,
            married: this._married,
            kids: this._kids,
            qualification: this._qualification,
            hasPressedSpin: this._hasPressedSpin,
            assets: this._assets.map(ownedAsset => ownedAsset.toJSON()),
        };
    }

    public static fromJSON(data: PlayerSave): Player {
        const player = new Player(data.name, data.color);
        player._money = data.money;
        player._lifePoints = data.lifePoints;
        player._salary = data.salary;
        player._married = data.married;
        player._kids = data.kids;
        player._qualification = data.qualification;
        player._hasPressedSpin = data.hasPressedSpin;
        player._assets = data.assets.map(assetData => OwnedAsset.fromJSON(assetData));
        return player;
    }
}

enum Qualification {
    None,
    Degree,
    PhD
}