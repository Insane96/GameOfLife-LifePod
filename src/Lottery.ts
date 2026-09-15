import {Player} from "./Player";
import {Mth} from "./Mth";
import {Game} from "./Game";
import {HouseRules} from "./HouseRules";

export class Lottery {
    public static pot: number;
    public static numbersPerPlayer: Map<Player, number[]> = new Map();
    public static playedRoundsBonus: number = 0;

    public static newLottery() {
        Lottery.playedRoundsBonus = 1 + Math.floor(Game.playedRounds / 5);
        Lottery.pot = Mth.triangleInt(20, 120, 120) * Lottery.playedRoundsBonus;
    }

    public static addNumbersToPlayer(player: Player, ...numbers: number[]) {
        for (const number of numbers) {
            if (number < 1 || number > 10)
                throw new Error(`Number ${number} is outside the 1~10 range`);
        }
        if (new Set(numbers).size !== numbers.length)
            throw new Error("Can't assign the same number twice to the same player");
        for (const [otherPlayer, otherNumbers] of Lottery.numbersPerPlayer) {
            if (otherPlayer === player) continue;
            for (const number of numbers) {
                if (otherNumbers.includes(number))
                    throw new Error(`Number ${number} is already taken by another player`);
            }
        }
        Lottery.numbersPerPlayer.set(player, numbers);
    }

    public static roll() {
        if (Lottery.numbersPerPlayer.size === 0)
            throw new Error("Can't start lottery numbers extraction: no players have chosen numbers");
        let won: boolean = false;
        let numbersToRoll: number[] = [];
        for (let i = 1; i < 11; i++) {
            numbersToRoll.push(i);
        }
        do {
            let rolledNumberIndex = Mth.randomInt(0, numbersToRoll.length - 1);
            for (const [player, numbers] of Lottery.numbersPerPlayer) {
                if (numbers.includes(numbersToRoll[rolledNumberIndex])) {
                    won = true;
                    player.addMoney(Lottery.pot * 1000);
                    break;
                }
            }
            if (!won) {
                numbersToRoll = numbersToRoll.filter((_, i) => i !== rolledNumberIndex);
                let noWinnerIncrease = 20;
                if (HouseRules.LotteryPlayedRoundsBonusOnNoWinner)
                    noWinnerIncrease *= Lottery.playedRoundsBonus;
                Lottery.pot += noWinnerIncrease;
            }
        } while (!won && numbersToRoll.length > 0);
        Lottery.reset();
    }

    public static reset() {
        Lottery.pot = 0;
        Lottery.numbersPerPlayer = new Map();
    }
}