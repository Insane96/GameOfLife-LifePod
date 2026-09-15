import {Player} from "./Player";
import {Mth} from "./Mth";
import {PlayerColor} from "./PlayerColor";
import {HouseRules} from "./HouseRules";

export class Game {
    public static conversionRatio: number;
    public static years: number;
    public static playedRounds: number = 0;
    public static players: Array<Player> = [];
    public static currentPlayerTurn: number;

    public static winner: Player;

    public static init(years: number) {
        Game.conversionRatio = Mth.randomDouble(80, 100);
        Game.years = years;
    }

    public static addPlayer(name: string, color: PlayerColor) {
        if (Game.players.some(player => player.name === name)
                || (Game.players.some(player => player.color === color)))
                throw new Error(`Player ${name} already has ${color}`);
        Game.players.push(new Player(name, color));
    }

    /**
     * Ends the current player's turn and returns the next player
     */
    public static endTurn(): Player {
        Game.currentPlayerTurn++;
        if (Game.currentPlayerTurn >= Game.players.length) {
            Game.currentPlayerTurn = 0;
            Game.years--;
            Game.playedRounds++;
            if (Game.years <= 0) {
                this.endGame();
                return Game.getCurrentPlayerTurn();
            }
        }
        Game.getCurrentPlayerTurn().onNewTurn();
        return Game.getCurrentPlayerTurn();
    }

    public static endGame() {
        for (const player of Game.players) {
            player.sellAllAssets();
            player.convertMoneyToLifePoints();
        }
        Game.winner = Game.players.reduce((best, player) =>
            player.lifePoints > best.lifePoints ? player : best
        );
    }

    public static getCurrentPlayerTurn(): Player {
        return Game.players[Game.currentPlayerTurn];
    }

    public static roll(): number {
        if (HouseRules.BalancedRolling)
            return Game.getCurrentPlayerTurn().modifyRollByCar(Mth.triangleInt(1, 10));
        else
            return Game.getCurrentPlayerTurn().modifyRollByCar(Mth.randomInt(1, 10));
    }

    public static probability(): number {
        const r = Math.random();
        if (r < 0.5)
            return 0;
        if (r < 0.75)
            return 1;
        return 2;
    }
}