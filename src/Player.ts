import {PlayerColor} from "./PlayerColor";

export class Player {
    private _money: number = 0;
    private _lifePoints: number = 0;
    private _married: boolean = false;
    private _kids: number = 0;
    private hasEconomyCar: boolean = false;
    private hasLuxuryCar: boolean = false;

    constructor(
        public name: string,
        public color: PlayerColor,
    ) {

    }

    get money(): number {
        return this._money;
    }

    public addMoney(money: number): void {
        if (money <= 0 || money > 2000000)
            throw new Error("money must be between 1 and 2.000.000 (inclusive)");
        this._money += money;
    }

    get lifePoints(): number {
        return this._lifePoints;
    }

    public addLifePoints(lifePoints: number): void {
        if (lifePoints <= 0 || lifePoints > 5000)
            throw new Error("lifePoints must be between 1 and 5.000 (inclusive)");
        this._lifePoints += lifePoints;
    }

    get married() {
        return this._married;
    }

    public marriage() {
        this._married = true;
        //this.lifePoints += 5000;
    }

    get kids() {
        return this._kids;
    }

    public addKids(kids: number) {
        if (kids < 1 || kids > 2)
            throw new Error("kids must be between 1 or 2");
        if (/*!Game.houseRules && */this._kids + kids > 9)
            throw new Error("Can't add kids. Can't go over 9");
        this._kids += kids;
    }

    /**
     * Clamps rolls by car. With luxury car you can't roll 1 or 2 and with an economy car you can't roll a 1
     */
    public modifyRollByCar(rolledNumber: number): number {
        if (this.hasLuxuryCar && rolledNumber < 3) return 3;
        if (this.hasEconomyCar && rolledNumber < 2) return 2;
        return rolledNumber;
    }
}