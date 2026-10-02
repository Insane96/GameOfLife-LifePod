import {lottery} from "../Lottery.js";
import {Player} from "../Player.js";
import {ALL_PLAYER_COLORS, PlayerColor} from "../PlayerColor.js";
import {RollingAnimation} from "./RollingAnimation.js";
import {playScreenUI} from "./PlayScreenUI.js";
import {persistence} from "../Persistence.js";
import {i18n, t} from "../i18n/I18n.js";

// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void, hide(): void } };
};

class LotteryUI {
    private lotteryModal = document.getElementById("lottery-modal") as HTMLDivElement;
    private lotteryPot = document.getElementById("lottery-pot") as HTMLDivElement;
    private lotteryPlayerList = document.getElementById("lottery-player-list") as HTMLDivElement;
    private btnLotterySpin = document.getElementById("btn-lottery-spin") as HTMLButtonElement;

    private rollModal = document.getElementById("roll-modal") as HTMLDivElement;
    private rollPotWrapper = document.getElementById("roll-pot-wrapper") as HTMLDivElement;
    private rollPot = document.getElementById("roll-pot") as HTMLDivElement;
    private rollingAnimation: RollingAnimation | null = null;
    // True for the whole failed-attempts + winner sequence, including the pauses between spins
    private rollSequenceActive: boolean = false;

    constructor() {
        this.lotteryModal.addEventListener("show.bs.modal", () => {
            if (lottery.pot === 0)
                lottery.newLottery();
            this.render();
        });
        // Blocks closing (click outside, Esc) until the whole draw sequence is over
        this.rollModal.addEventListener("hide.bs.modal", (event) => {
            if (this.rollSequenceActive)
                event.preventDefault();
        });
        this.rollModal.addEventListener("hidden.bs.modal", () => {
            this.clearRollMarks();
            this.rollPotWrapper.classList.add("d-none");
        });
        this.btnLotterySpin.addEventListener("click", () => this.onSpin());
    }

    public render() {
        this.lotteryPot.textContent = `€ ${(lottery.pot * 1000).toLocaleString(i18n.getLocale())}`;

        const activePlayer = lottery.getActivePlayer();
        const chosenNumbers = lottery.getChosenNumbers();
        const rows: HTMLElement[] = [];
        for (const player of lottery.getPickOrder()) {
            rows.push(this.createPlayerRow(player, player === activePlayer, chosenNumbers));
        }
        this.lotteryPlayerList.replaceChildren(...rows);

        this.btnLotterySpin.disabled = activePlayer !== null || lottery.numbersPerPlayer.size === 0;

        persistence.save();
    }

    private createPlayerRow(player: Player, isActive: boolean, chosenNumbers: number[]): HTMLElement {
        const borderClass = this.borderClassForColor(player.color);

        // One bordered card per player, tinted with their color (same "Visa card" identity
        // cue as the rest of the game), instead of everyone crammed into a single row.
        const row = document.createElement("div");
        row.classList.add("d-flex", "flex-column", "gap-1", "p-2", "rounded-3", "border", borderClass);

        const label = document.createElement("div");
        label.classList.add("fw-semibold");
        label.textContent = `${player.name} (${lottery.getRequiredCount(player)})`;
        row.appendChild(label);

        const numbersRow = document.createElement("div");
        numbersRow.classList.add("d-flex", "align-items-center", "flex-wrap", "gap-1");
        row.appendChild(numbersRow);

        const playerNumbers = lottery.numbersPerPlayer.get(player) ?? [];
        const required = lottery.getRequiredCount(player);
        for (let number = 0; number <= 10; number++) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = String(number);
            button.classList.add("btn", "btn-sm", "btn-outline-secondary");
            const isOwn = playerNumbers.includes(number);
            button.classList.toggle("roll-number-chosen", isOwn);
            button.classList.toggle(borderClass, isOwn);
            if (isOwn) {
                // Clicking an already-picked number frees it up again, so a mistake can be corrected
                button.disabled = !isActive;
                button.addEventListener("click", () => {
                    this.setPlayerNumbers(player, playerNumbers.filter(n => n !== number));
                });
            }
            else {
                const isTakenByOther = chosenNumbers.includes(number);
                button.disabled = !isActive || isTakenByOther || playerNumbers.length >= required;
                button.addEventListener("click", () => {
                    this.setPlayerNumbers(player, [...playerNumbers, number]);
                });
            }
            numbersRow.appendChild(button);
        }

        if (isActive) {
            const btnConfirm = document.createElement("button");
            btnConfirm.type = "button";
            btnConfirm.textContent = "✓";
            btnConfirm.ariaLabel = t("lottery.confirmNumbers", {name: player.name});
            btnConfirm.classList.add("btn", "btn-sm", "btn-success");
            btnConfirm.disabled = playerNumbers.length !== required;
            btnConfirm.addEventListener("click", () => {
                try {
                    lottery.confirmPicks(player);
                }
                catch (e) {
                    playScreenUI.onError(e);
                }
                this.render();
            });
            numbersRow.appendChild(btnConfirm);
        }
        return row;
    }

    private setPlayerNumbers(player: Player, numbers: number[]) {
        try {
            lottery.addNumbersToPlayer(player, ...numbers);
        }
        catch (e) {
            playScreenUI.onError(e);
        }
        this.render();
    }

    private borderClassForColor(color: PlayerColor): string {
        return `border-${PlayerColor[color].toLowerCase()}`;
    }

    private onSpin() {
        const chosenNumberOwners: {number: number, color: PlayerColor}[] = [];
        for (const [player, numbers] of lottery.numbersPerPlayer) {
            for (const number of numbers)
                chosenNumberOwners.push({number, color: player.color});
        }
        const startingPot = lottery.pot;
        try {
            lottery.roll();
        }
        catch (e) {
            playScreenUI.onError(e);
            return;
        }
        // roll() already paid out the winner; save right away instead of waiting for the next
        // render() (LotteryUI's own render() doesn't run again until the modal reopens, and the
        // animated reveal below takes a few seconds — a reload during it would otherwise lose it).
        persistence.save();
        bootstrap.Modal.getOrCreateInstance(this.lotteryModal).hide();
        for (const {number, color} of chosenNumberOwners) {
            document.getElementById(`roll-number-${number}`)?.classList.add("roll-number-chosen", this.borderClassForColor(color));
        }
        this.rollPotWrapper.classList.remove("d-none");
        this.setRollPot(startingPot);
        bootstrap.Modal.getOrCreateInstance(this.rollModal).show();
        this.rollSequenceActive = true;
        // Replays every number the model tried (roll() already picked the winner and paid it out):
        // failed attempts get dimmed one after another, the sequence ends on the actual winner.
        this.playRollAttempts([...lottery.lastRollAttempts]);
    }

    private setRollPot(potValue: number) {
        this.rollPot.textContent = `€ ${(potValue * 1000).toLocaleString(i18n.getLocale())}`;
    }

    private playRollAttempts(attempts: {number: number, won: boolean, pot: number}[]) {
        const attempt = attempts[0];
        const remaining = attempts.slice(1);
        try {
            this.rollingAnimation = new RollingAnimation(0, 10, 4, attempt.number, () => this.onRollAttemptEnd(attempt, remaining));
        }
        catch (e) {
            playScreenUI.onError(e);
            this.rollingAnimation = null;
            this.rollSequenceActive = false;
        }
    }

    private onRollAttemptEnd(attempt: {number: number, won: boolean, pot: number}, remaining: {number: number, won: boolean, pot: number}[]) {
        this.rollingAnimation = null;
        this.setRollPot(attempt.pot);
        if (attempt.won) {
            this.rollSequenceActive = false;
            playScreenUI.render();
        }
        else {
            document.getElementById(`roll-number-${attempt.number}`)?.classList.add("roll-number-missed");
            setTimeout(() => this.playRollAttempts(remaining), 700);
        }
    }

    private clearRollMarks() {
        for (let number = 0; number <= 10; number++) {
            const element = document.getElementById(`roll-number-${number}`);
            element?.classList.remove("roll-number-chosen", "roll-number-missed");
            for (const color of ALL_PLAYER_COLORS)
                element?.classList.remove(this.borderClassForColor(color));
        }
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const lotteryUI = new LotteryUI();
