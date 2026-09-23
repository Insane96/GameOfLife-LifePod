import {Player} from "./Player.js";
import {Mth} from "./Mth.js";
import {PlayerColor} from "./PlayerColor.js";
import {HouseRules} from "./HouseRules.js";

class Game {
    // Set by init()
    public conversionRatio!: number;
    public years!: number;
    public playedRounds: number = 0;
    public players: Array<Player> = [];
    public currentPlayerTurn: number = 0;

    public rolledNumber: number = 0;
    public rolledChance: number = 0;

    private _gameStarted: boolean = false;

    public get gameStarted(): boolean {
        return this._gameStarted;
    }

    public init(years: number) {
        this.conversionRatio = Mth.randomDouble(80, 100);
        this.years = years;
        this._gameStarted = true;
    }

    public addPlayer(name: string, color: PlayerColor): Player {
        if (this.players.some(player => player.name === name)
                || (this.players.some(player => player.color === color)))
                throw new Error(`Player ${name} already has ${color}`);
        let player = new Player(name, color);
        this.players.push(player);
        return player;
    }

    /**
     * Ends the current player's turn if has pressed spin
     */
    public endTurn() {
        let currentPlayer: Player = this.getCurrentPlayerTurn();
        if (!currentPlayer.hasPressedSpin)
            throw new Error("Can't end turn: player hasn't pressed Spin");
        currentPlayer.endTurn();
        this.rolledNumber = 0;
        this.currentPlayerTurn++;
        if (this.currentPlayerTurn >= this.players.length) {
            this.currentPlayerTurn = 0;
            this.years--;
            this.playedRounds++;
            if (this.years <= 0)
                this.endGame();
        }
    }

    public endGame() {
        for (const player of this.players) {
            player.sellAllAssets();
            player.convertMoneyToLifePoints();
        }
    }

    public getCurrentPlayerTurn(): Player {
        return this.players[this.currentPlayerTurn];
    }

    public roll() {
        this.rolledNumber = HouseRules.BalancedRolling ?
            this.getCurrentPlayerTurn().modifyRollByCar(Mth.triangleInt(1, 10)) :
            this.getCurrentPlayerTurn().modifyRollByCar(Mth.randomInt(1, 10));
    }

    public chance(): number {
        const r = Math.random();
        if (r < 0.5)
            return 0;
        if (r < 0.75)
            return 1;
        return 2;
    }

    public getRanking(): Player[] {
        return [...this.players].sort((a, b) => b.lifePoints - a.lifePoints);
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const game = new Game();
