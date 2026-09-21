import {PlayerColor} from "./PlayerColor.js";
import {Asset} from "./Asset.js";
import {OwnedAsset} from "./OwnedAsset.js";
import {HouseRules} from "./HouseRules.js";
import {game} from "./Game.js";

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

    public onSpin() {
        if (this._hasPressedSpin)
            throw new Error("Player has already pressed Spin");
        let salaryPenalty: number = 0;
        if (game.playedRounds >= 3 && !this._assets.some(ownedAsset => ownedAsset.asset.isHouse()))
            salaryPenalty += 0.15;
        if (this._kids > 0) {
            //TODO Track age so they will no longer cost anything @ 18 years
            let kidsPenalty = 0.05 + (Math.min(this._kids, 5) * 0.05);
            if (this._kids > 5)
                kidsPenalty += 0.03 * (this._kids - 5);
            if (kidsPenalty > 0.4)
                kidsPenalty = 0.4;
            salaryPenalty += kidsPenalty;
        }
        let calculatedSalary: number = this._salary * (1 - salaryPenalty);
        this.addMoney(calculatedSalary);
        if (this._money < 0)
            this.removeMoney(-this._money * 0.10);
        for (const asset of this._assets) {
            asset.onNewTurn(this);
        }
        if (this._married)
            this.addLifePoints(1500);
        if (this._kids > 0) {
            this.addLifePoints(this._kids * 350);
        }
        game.roll();
        this._hasPressedSpin = true;
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
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money += money;
        this._money = Math.round(this._money);

    }

    public removeMoney(money: number): void {
        if (Number.isNaN(money))
            throw new Error("money must be a number.");
        if (money <= 0 || money > 2000000)
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money -= money;
        this._money = Math.round(this._money);
    }

    public get salary(): number {
        return this._salary;
    }

    public set salary(value: number) {
        if (value < 5000 || value > 2000000)
            throw new Error("salary must be between 1 and 2.000.000 (inclusive)");
        this._salary = value;
    }

    public get lifePoints(): number {
        return this._lifePoints;
    }

    public addLifePoints(lifePoints: number): void {
        if (Number.isNaN(lifePoints))
            throw new Error("lifePoints must be a number.");
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new Error("lifePoints must be between 1 and 5.000 (inclusive)");
        this._lifePoints += lifePoints;
        this._lifePoints = Math.round(this._lifePoints);
    }

    public removeLifePoints(lifePoints: number): void {
        if (Number.isNaN(lifePoints))
            throw new Error("lifePoints must be a number.");
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new Error("lifePoints must be between 1 and 5.000 (inclusive)");
        this._lifePoints -= lifePoints;
        this._lifePoints = Math.round(this._lifePoints);
    }

    public get married() {
        return this._married;
    }

    public getMarried() {
        this._married = true;
        this.addLifePoints(3500);
        for (const player of game.players) {
            if (player === this)
                continue;
            player.removeMoney(1000);
            this.addMoney(1000);
        }
    }

    public get kids() {
        return this._kids;
    }

    public addKids(kids: number) {
        if (kids < 1 || kids > 2)
            throw new Error("kids must be between 1 or 2");
        if (!HouseRules.UnlimitedKids && this._kids + kids > 9)
            throw new Error("Can't add kids. Can't go over 9");
        this._kids += kids;
        this.addLifePoints(kids * 350);
    }

    public tryForAKid() {
        let kids = game.probability();
        if (kids > 0)
            this.addKids(kids);
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

    public bid(amount: number) {
        let result = game.probability();
        //TODO House rule to win with 1 and 2
        if (result == 0)
            this.removeMoney(amount);
        else if (result == 2)
            this.addMoney(amount);
    }

    /**
     * Clamps rolls by car. With luxury car you can't roll 1 or 2 and with an economy car you can't roll a 1
     */
    public modifyRollByCar(rolledNumber: number): number {
        if (HouseRules.BalancedRolling) {
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
}

enum Qualification {
    None,
    Degree,
    PhD
}