import {PlayerColor} from "./PlayerColor";
import {Asset} from "./Asset";
import {OwnedAsset} from "./OwnedAsset";

export class Player {
    private _money: number = 0;
    private _lifePoints: number = 0;
    private _salary: number = 5000;
    private _married: boolean = false;
    private _kids: number = 0;
    private _assets: Array<OwnedAsset> = [];

    constructor(
        public name: string,
        public color: PlayerColor,
    ) {

    }

    public onNewTurn() {
        this.addMoney(this.salary);
        for (const asset of this._assets) {
            asset.onNewTurn(this);
        }
    }

    public get money(): number {
        return this._money;
    }

    public addMoney(money: number): void {
        if (money <= 0 || money > 2000000)
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money += money;
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

    public get marry() {
        return this._married;
    }

    public getMarried() {
        this._married = true;
        //this.lifePoints += 5000;
    }

    public get kids() {
        return this._kids;
    }

    public addKids(kids: number) {
        if (kids < 1 || kids > 2)
            throw new Error("kids must be between 1 or 2");
        if (/*!Game.houseRules && */this._kids + kids > 9)
            throw new Error("Can't add kids. Can't go over 9");
        this._kids += kids;
    }

    public addAsset(asset: Asset) {
        if (this.hasAsset(asset))
            throw new Error("Cannot add asset. Player already has asset");
        this._assets.push(new OwnedAsset(asset));
    }

    public hasAsset(asset: Asset): boolean {
        return this._assets.some(ownedAsset => ownedAsset.asset === asset);
    }

    public removeAsset(asset: Asset) {
        this._assets = this._assets.filter(ownedAsset => ownedAsset.asset !== asset);
    }

    /**
     * Clamps rolls by car. With luxury car you can't roll 1 or 2 and with an economy car you can't roll a 1
     */
    public modifyRollByCar(rolledNumber: number): number {
        if (this.hasAsset(Asset.LuxuryCar) && rolledNumber < 3) return 3;
        if (this.hasAsset(Asset.EconomyCar) && rolledNumber < 2) return 2;
        return rolledNumber;
    }
}