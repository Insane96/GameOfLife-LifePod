import {Player} from "./Player";
import {Mth} from "./Mth";
import {PlayerColor} from "./PlayerColor";

export class Game {
    public static conversionRatio: number;
    public static years: number;
    public static players: Array<Player> = [];
    public static currentPlayerTurn: number;

    //Maybe move to class with each house rule configurable, like unlimited kids and better rolling
    public static houseRules: boolean = false;

    public static init(years: number) {
        Game.conversionRatio = Mth.randomDouble(80, 120);
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
        }
        return Game.getCurrentPlayerTurn();
    }

    public static getCurrentPlayerTurn(): Player {
        return Game.players[Game.currentPlayerTurn];
    }

    public static roll(): number {
        return Game.getCurrentPlayerTurn().modifyRollByCar(Mth.randomInt(1, 11));
    }

    public static probability(): number {
        let r = Math.random();
        if (r < 0.5)
            return 0;
        if (r < 0.75)
            return 1;
        return 2;
    }
}