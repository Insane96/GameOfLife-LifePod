import {PlayerColor} from "./PlayerColor";
import {Asset} from "./Asset";
import {OwnedAsset} from "./OwnedAsset";
import {HouseRules} from "./HouseRules";
import {Game} from "./Game";

export class Player {
    private _money: number = 0;
    private _lifePoints: number = 0;
    private _salary: number = 5000;
    private _married: boolean = false;
    private _kids: number = 0;
    private _assets: Array<OwnedAsset> = [];
    private _qualification: Qualification = Qualification.None;

    constructor(
        public name: string,
        public color: PlayerColor,
    ) {

    }

    public onNewTurn() {
        let calculatedSalary: number = this._salary;
        if (Game.playedRounds >= 3 && !this._assets.some(ownedAsset => ownedAsset.asset.isHouse()))
            //Rent
            calculatedSalary *= 0.85;
        this.addMoney(calculatedSalary);
        if (this._money < 0)
            this.removeMoney(this._money * 0.10);
        for (const asset of this._assets) {
            asset.onNewTurn(this);
        }
        if (this._married)
            this.addLifePoints(1500);
        this.addLifePoints(this._kids * 500);
    }

    public get money(): number {
        return this._money;
    }

    public addMoney(money: number): void {
        if (money <= 0 || money > 2000000)
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money += money;
    }

    public removeMoney(money: number): void {
        if (money <= 0 || money > 2000000)
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money -= money;
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
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new Error("lifePoints must be between 1 and 5.000 (inclusive)");
        this._lifePoints += lifePoints;
    }

    public removeLifePoints(lifePoints: number): void {
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new Error("lifePoints must be between 1 and 5.000 (inclusive)");
        this._lifePoints -= lifePoints;
    }

    public get marry() {
        return this._married;
    }

    public getMarried() {
        this._married = true;
        this._lifePoints += 3000;
        for (const player of Game.players) {
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
}

enum Qualification {
    None,
    Degree,
    PhD
}