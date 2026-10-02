import {Player} from "./Player.js";
import {Mth} from "./Mth.js";
import {game} from "./Game.js";
import {HouseRules} from "./HouseRules.js";
import {GameError} from "./GameError.js";

export interface LotterySave {
    pot: number;
    playedRoundsBonus: number;
    winningNumber: number;
    // numbersPerPlayer/confirmedPlayers are keyed by Player object identity, so they're saved as
    // indices into game.players and resolved back to references on load (see loadFromJSON()).
    numbersPerPlayer: {playerIndex: number, numbers: number[]}[];
    confirmedPlayerIndexes: number[];
}

class Lottery {
    public pot: number = 0;
    public numbersPerPlayer: Map<Player, number[]> = new Map();
    public confirmedPlayers: Set<Player> = new Set();
    public playedRoundsBonus: number = 0;
    public winningNumber: number = -1;
    /**
     * Every number tried by the last roll() call, in order, each with whether it won and the pot
     * as it stood right after that attempt (roll() resets pot to 0 before the UI replays this list,
     * so this is the only record of how it grew).
     */
    public lastRollAttempts: {number: number, won: boolean, pot: number}[] = [];

    public newLottery() {
        this.playedRoundsBonus = 1 + Math.floor(game.playedRounds / 5);
        this.pot = Mth.triangleInt(20, 120, 120) * this.playedRoundsBonus;
    }

    public addNumbersToPlayer(player: Player, ...numbers: number[]) {
        for (const number of numbers) {
            if (number < 0 || number > 10)
                throw new Error(`Number ${number} is outside the 0~10 range`);
        }
        if (new Set(numbers).size !== numbers.length)
            throw new GameError("error.lotteryDuplicateNumber");
        for (const [otherPlayer, otherNumbers] of this.numbersPerPlayer) {
            if (otherPlayer === player) continue;
            for (const number of numbers) {
                if (otherNumbers.includes(number))
                    throw new GameError("error.lotteryNumberTaken", {number});
            }
        }
        this.numbersPerPlayer.set(player, numbers);
    }

    public roll() {
        if (this.numbersPerPlayer.size === 0)
            throw new GameError("error.lotteryNoNumbers");
        this.lastRollAttempts = [];
        let won: boolean = false;
        let numbersToRoll: number[] = [];
        for (let i = 0; i < 11; i++) {
            numbersToRoll.push(i);
        }
        do {
            let rolledNumberIndex = Mth.randomInt(0, numbersToRoll.length - 1);
            const rolledNumber = numbersToRoll[rolledNumberIndex];
            for (const [player, numbers] of this.numbersPerPlayer) {
                if (numbers.includes(rolledNumber)) {
                    won = true;
                    this.winningNumber = rolledNumber;
                    player.addMoney(this.pot * 1000);
                    break;
                }
            }
            if (!won) {
                numbersToRoll = numbersToRoll.filter((_, i) => i !== rolledNumberIndex);
                let noWinnerIncrease = 20;
                if (HouseRules.LotteryPotBonusOnNoWinnerYearsPlayedBased.get())
                    noWinnerIncrease *= this.playedRoundsBonus;
                this.pot += noWinnerIncrease;
            }
            this.lastRollAttempts.push({number: rolledNumber, won, pot: this.pot});
        } while (!won && numbersToRoll.length > 0);
        this.reset();
    }

    public reset() {
        this.pot = 0;
        this.numbersPerPlayer = new Map();
        this.confirmedPlayers = new Set();
    }

    /**
     * Turn order for choosing lottery numbers: the current player first, then the others
     * in turn order starting right after them.
     */
    public getPickOrder(): Player[] {
        const currentIndex = game.currentPlayerTurn;
        return [
            ...game.players.slice(currentIndex),
            ...game.players.slice(0, currentIndex)
        ];
    }

    /**
     * The current player picks 3 numbers, everyone else picks 1.
     */
    public getRequiredCount(player: Player): number {
        return player === game.getCurrentPlayerTurn() ? 3 : 1;
    }

    /**
     * First player in turn order who hasn't confirmed their numbers yet, or null if everyone is done.
     */
    public getActivePlayer(): Player | null {
        for (const player of this.getPickOrder()) {
            if (!this.confirmedPlayers.has(player))
                return player;
        }
        return null;
    }

    /**
     * Locks in the active player's numbers, moving the turn to the next player.
     * Can be changed freely (addNumbersToPlayer again) until this is called.
     */
    public confirmPicks(player: Player) {
        const picked = this.numbersPerPlayer.get(player)?.length ?? 0;
        if (picked !== this.getRequiredCount(player))
            throw new GameError("error.lotteryPickCount", {name: player.name, count: this.getRequiredCount(player)});
        this.confirmedPlayers.add(player);
    }

    public getChosenNumbers(): number[] {
        const numbers: number[] = [];
        for (const playerNumbers of this.numbersPerPlayer.values()) {
            numbers.push(...playerNumbers);
        }
        return numbers;
    }

    public toJSON(): LotterySave {
        return {
            pot: this.pot,
            playedRoundsBonus: this.playedRoundsBonus,
            winningNumber: this.winningNumber,
            numbersPerPlayer: [...this.numbersPerPlayer.entries()].map(([player, numbers]) => ({
                playerIndex: game.players.indexOf(player),
                numbers,
            })),
            confirmedPlayerIndexes: [...this.confirmedPlayers].map(player => game.players.indexOf(player)),
        };
    }

    /**
     * @param players the already-reconstructed players to resolve numbersPerPlayer/
     * confirmedPlayers' indices against (see Game.loadFromJSON(), which must run first).
     */
    public loadFromJSON(data: LotterySave, players: Player[]): void {
        this.pot = data.pot;
        this.playedRoundsBonus = data.playedRoundsBonus;
        this.winningNumber = data.winningNumber;
        this.numbersPerPlayer = new Map(data.numbersPerPlayer.map(({playerIndex, numbers}) => [players[playerIndex], numbers]));
        this.confirmedPlayers = new Set(data.confirmedPlayerIndexes.map(index => players[index]));
        this.lastRollAttempts = [];
    }
}

export const lottery = new Lottery();