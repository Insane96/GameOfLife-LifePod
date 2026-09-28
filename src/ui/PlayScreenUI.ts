import {game} from "../Game.js";
import {Player} from "../Player.js";
import {Asset} from "../Asset.js";
import {PlayerColor} from "../PlayerColor.js";
import {Operation} from "./Operation.js";
import {RollingAnimation} from "./RollingAnimation.js";
import {sounds} from "./Sounds.js";

// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void } };
    Toast: new (element: Element, options?: {delay?: number}) => { show(): void };
};

enum RollingAnimationType {
    Spin,
    TryForAKid,
    BusinessAuction
}

class PlayScreenUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    private toastContainer = document.getElementById("toast-container") as HTMLDivElement;
    private btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
    private btnEndTurn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    private yearsLeft = document.getElementById("years-left") as HTMLDivElement;
    private playerName = document.getElementById("player-name") as HTMLDivElement;
    private playError = document.getElementById("play-error") as HTMLDivElement;
    private playerScoreboard = document.getElementById("player-scoreboard") as HTMLTableSectionElement;
    private playerScoreboardHeader = document.getElementById("player-scoreboard-header") as HTMLTableSectionElement;

    private playerMoney = document.getElementById("player-money") as HTMLDivElement;
    private btnAddMoney = document.getElementById("btn-add-money") as HTMLButtonElement;
    private btnRemoveMoney = document.getElementById("btn-remove-money") as HTMLButtonElement;
    private inputMoney = document.getElementById("input-money") as HTMLInputElement;
    private btnConfirmMoney = document.getElementById("btn-confirm-money") as HTMLButtonElement;

    private playerLifePoints = document.getElementById("player-life-points") as HTMLDivElement;
    private btnAddLifePoints = document.getElementById("btn-add-life-points") as HTMLButtonElement;
    private btnRemoveLifePoints = document.getElementById("btn-remove-life-points") as HTMLButtonElement;
    private inputLifePoints = document.getElementById("input-life-points") as HTMLInputElement;
    private btnConfirmLifePoints = document.getElementById("btn-confirm-life-points") as HTMLButtonElement;

    private _operation: Operation = Operation.None;

    private btnSalary = document.getElementById("btn-salary") as HTMLButtonElement;
    private inputSalary = document.getElementById("input-salary") as HTMLInputElement;
    private btnConfirmSalary = document.getElementById("btn-confirm-salary") as HTMLButtonElement;

    private btnAuction = document.getElementById("btn-auction") as HTMLButtonElement;
    private inputAuction = document.getElementById("input-auction") as HTMLInputElement;
    private btnConfirmAuction = document.getElementById("btn-confirm-auction") as HTMLButtonElement;

    private playerRoll =document.getElementById("player-roll") as HTMLDivElement;
    private playerRollNumber = document.getElementById("player-roll-number") as HTMLDivElement;
    private rollModal = document.getElementById("roll-modal") as HTMLDivElement;
    private rollingAnimation: RollingAnimation | null = null;
    private rollingAnimationType: RollingAnimationType | null = null;

    private btnChance = document.getElementById("btn-chance") as HTMLButtonElement;
    private chanceResult = document.getElementById("chance-result") as HTMLDivElement;
    private chanceResultNumber = document.getElementById("chance-result-number") as HTMLDivElement;

    private btnWedding = document.getElementById("btn-wedding") as HTMLButtonElement;
    private btnWeddingLabel = document.getElementById("btn-wedding-label") as HTMLSpanElement;
    private btnKids = document.getElementById("btn-kids") as HTMLButtonElement;
    private btnKidsLabel = document.getElementById("btn-kids-label") as HTMLSpanElement;
    private btn1Kid = document.getElementById("btn-1-kid") as HTMLButtonElement;
    private btn2Kids = document.getElementById("btn-2-kids") as HTMLButtonElement;
    private btnTryKid = document.getElementById("btn-try-kid") as HTMLButtonElement;

    private btnLottery = document.getElementById("btn-lottery") as HTMLButtonElement;

    private btnHouses = document.getElementById("btn-houses") as HTMLButtonElement;
    private btnCars = document.getElementById("btn-cars") as HTMLButtonElement;
    private assetButtons: {button: HTMLButtonElement, asset: Asset, name: string}[] = [
        {button: document.getElementById("btn-house-small") as HTMLButtonElement, asset: Asset.SmallHouse, name: "Modest House"},
        {button: document.getElementById("btn-house-medium") as HTMLButtonElement, asset: Asset.MediumHouse, name: "Mid-sized House"},
        {button: document.getElementById("btn-house-large") as HTMLButtonElement, asset: Asset.BigHouse, name: "Mansion"},
        {button: document.getElementById("btn-car-economy") as HTMLButtonElement, asset: Asset.EconomyCar, name: "Economy Car"},
        {button: document.getElementById("btn-car-luxury") as HTMLButtonElement, asset: Asset.LuxuryCar, name: "Luxury Car"},
    ];

    private inputVolume: HTMLInputElement = document.getElementById("input-volume") as HTMLInputElement;

    private confirmModal = document.getElementById("confirm-modal") as HTMLDivElement;
    private confirmMessage = document.getElementById("confirm-message") as HTMLParagraphElement;
    private btnConfirmOk = document.getElementById("btn-confirm-ok") as HTMLButtonElement;
    private confirmCallback: (() => void) | null = null;

    // Snapshot of the last money/Life Points shown for the current player, so render() can tell
    // a real change (worth a count-up animation and a delta toast) from a turn change or a
    // re-render triggered by something else (e.g. opening an operation).
    private statsPlayer: Player | null = null;
    private lastMoney: number = 0;
    private lastLifePoints: number = 0;

    constructor() {
        this.btnSpin.addEventListener("click", () => {
            this.clearError();
            let spun: boolean = false;
            try {
                game.getCurrentPlayerTurn().onSpin();
                spun = true;
            }
            catch (e) {
                this.onError(e);
            }
            if (spun)
                this.playRollAnimation();
            this.render();
        });
        // Blocks closing (click outside, Esc) until the animation is over
        this.rollModal.addEventListener("hide.bs.modal", (event) => {
            if (this.rollingAnimation !== null)
                event.preventDefault();
        });
        this.btnEndTurn.addEventListener("click", () => {
            this.clearError();
            try {
                game.endTurn();
            }
            catch (e) {
                this.onError(e);
            }
            this._operation = Operation.None;
            this.inputSalary.value = String(game.getCurrentPlayerTurn().salary);
            this.inputMoney.value = "";
            this.inputLifePoints.value = "";
            this.inputAuction.value = "";
            this.render();
        });
        this.btnAddMoney.addEventListener("click", () => {
            this.toggleOperation(Operation.AddMoney, this.inputMoney);
        });
        this.btnRemoveMoney.addEventListener("click", () => {
            this.toggleOperation(Operation.RemoveMoney, this.inputMoney);
        });
        this.btnConfirmMoney.addEventListener("click", () => {
            this.confirmOperationInput(this.inputMoney, Operation.AddMoney, Operation.RemoveMoney, (v) => game.getCurrentPlayerTurn().addMoney(v), (v) => game.getCurrentPlayerTurn().removeMoney(v));
        });
        this.inputMoney.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmMoney.click();
        });
        this.btnAddLifePoints.addEventListener("click", () => {
            this.toggleOperation(Operation.AddLifePoints, this.inputLifePoints);
        });
        this.btnRemoveLifePoints.addEventListener("click", () => {
            this.toggleOperation(Operation.RemoveLifePoints, this.inputLifePoints);
        });
        this.btnConfirmLifePoints.addEventListener("click", () => {
            this.confirmOperationInput(this.inputLifePoints, Operation.AddLifePoints, Operation.RemoveLifePoints, (v) => game.getCurrentPlayerTurn().addLifePoints(v), (v) => game.getCurrentPlayerTurn().removeLifePoints(v));
        });
        this.inputLifePoints.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmLifePoints.click();
        });
        this.btnChance.addEventListener("click", () => {
            game.rollAndSetChance();
            this.playChanceAnimation();
            this.render();
        });
        this.btnSalary.addEventListener("click", () => {
            this.inputSalary.value = String(game.getCurrentPlayerTurn().salary);
            this.toggleOperation(Operation.Salary, this.inputSalary);
        });
        this.btnConfirmSalary.addEventListener("click", () => {
            this.clearError();
            let input = parseInt(this.inputSalary.value);
            if (Number.isNaN(input)) {
                this.showError("Invalid input");
                return;
            }
            try {
                game.getCurrentPlayerTurn().salary = input;
            }
            catch (e) {
                this.onError(e);
                return;
            }
            this._operation = Operation.None;
            this.render();
        });
        this.inputSalary.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmSalary.click();
        });
        this.btnAuction.addEventListener("click", () => {
            this.toggleOperation(Operation.Auction, this.inputAuction);
        });
        this.btnConfirmAuction.addEventListener("click", () => {
            this.clearError();
            let input = parseInt(this.inputAuction.value);
            if (Number.isNaN(input)) {
                this.showError("Invalid input");
                return;
            }
            try {
                game.getCurrentPlayerTurn().bid(input);
            }
            catch (e) {
                this.onError(e);
                return;
            }
            this._operation = Operation.None;
            this.inputAuction.value = "";
            this.playChanceAnimation();
        });
        this.inputAuction.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmAuction.click();
        });
        this.btnWedding.addEventListener("click", () => {
            this.confirmAction("Confirm Wedding/Anniversary?", () => {
                game.getCurrentPlayerTurn().getMarried();
                this.render();
            });
        });
        this.btnKids.addEventListener("click", () => {

        });
        this.btn1Kid.addEventListener("click", () => {
            this.clearError();
            try {
                game.getCurrentPlayerTurn().addKids(1);
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        this.btn2Kids.addEventListener("click", () => {
            this.clearError();
            try {
                game.getCurrentPlayerTurn().addKids(2);
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        this.btnTryKid.addEventListener("click", () => {
            this.clearError();
            let failed = false;
            try {
                game.getCurrentPlayerTurn().tryForAKid();
            }
            catch (e) {
                this.onError(e);
                failed = true;
            }
            if (!failed)
                this.playChanceAnimation();
        });
        for (const {button, asset, name} of this.assetButtons) {
            button.addEventListener("click", () => {
                this.clearError();
                const player = game.getCurrentPlayerTurn();
                const price = this.formatNumber(this.getAssetPrice(player, asset));
                if (player.hasAsset(asset)) {
                    this.confirmAction(`Sell ${name} for € ${price}?`, () => {
                        try {
                            player.sellAsset(asset);
                        }
                        catch (e) {
                            this.onError(e);
                        }
                        this.render();
                    });
                }
                else {
                    try {
                        player.buyAsset(asset);
                    }
                    catch (e) {
                        this.onError(e);
                    }
                    this.render();
                }
            });
        }
        this.inputVolume.addEventListener("input", () => {
            sounds.setVolume(this.inputVolume.valueAsNumber);
        });
        this.btnConfirmOk.addEventListener("click", () => {
            this.confirmCallback?.();
            this.confirmCallback = null;
        });
    }

    public render() {
        const currentPlayer: Player = game.getCurrentPlayerTurn();

        this.playerScoreboardHeader.classList.toggle("d-none", game.years > 0);
        if (game.years <= 0) {
            this.playerName.textContent = "";
            const rows: HTMLTableRowElement[] = [];
            game.getRanking().forEach((player, index) => {
                const row = document.createElement("tr");
                if (index === 0)
                    row.classList.add("table-warning");
                let cell = row.insertCell();
                cell.textContent = String(index + 1);
                cell = row.insertCell();
                cell.textContent = player.name;
                cell = row.insertCell();
                cell.textContent = `♥ ${this.formatNumber(player.lifePoints)}`;
                rows.push(row);
            });
            this.playerScoreboard.replaceChildren(...rows);
        }
        else
            this.playerName.textContent = currentPlayer.name;

        if (game.years <= 0) {
            this.playerMoney.textContent = "";
            this.playerLifePoints.textContent = "";
            this.playScreen.removeAttribute("data-player-color");
            this.statsPlayer = null;
        }
        else {
            this.playScreen.dataset.playerColor = PlayerColor[currentPlayer.color];

            const samePlayer = this.statsPlayer === currentPlayer;
            const fromMoney = samePlayer ? this.lastMoney : currentPlayer.money;
            const fromLifePoints = samePlayer ? this.lastLifePoints : currentPlayer.lifePoints;

            this.animateStatChange(this.playerMoney, fromMoney, currentPlayer.money, (v) => `€ ${this.formatNumber(v)}`);
            this.animateStatChange(this.playerLifePoints, fromLifePoints, currentPlayer.lifePoints, (v) => `♥ ${this.formatNumber(v)}`);

            if (samePlayer && currentPlayer.money !== this.lastMoney) {
                const delta = currentPlayer.money - this.lastMoney;
                this.showDeltaToast(`${delta > 0 ? "+" : "−"} € ${this.formatNumber(Math.abs(delta))}`, delta > 0);
            }
            if (samePlayer && currentPlayer.lifePoints !== this.lastLifePoints) {
                const delta = currentPlayer.lifePoints - this.lastLifePoints;
                this.showDeltaToast(`${delta > 0 ? "+" : "−"} ♥ ${this.formatNumber(Math.abs(delta))}`, delta > 0);
            }

            this.statsPlayer = currentPlayer;
            this.lastMoney = currentPlayer.money;
            this.lastLifePoints = currentPlayer.lifePoints;
        }

        const moneyOpen: boolean = this._operation === Operation.AddMoney || this._operation === Operation.RemoveMoney;
        const lifePointsOpen: boolean = this._operation === Operation.AddLifePoints || this._operation === Operation.RemoveLifePoints;
        this.inputMoney.classList.toggle("d-none", !moneyOpen);
        this.btnConfirmMoney.classList.toggle("d-none", !moneyOpen);
        this.inputLifePoints.classList.toggle("d-none", !lifePointsOpen);
        this.btnConfirmLifePoints.classList.toggle("d-none", !lifePointsOpen);

        for (const {button, asset, name} of this.assetButtons) {
            const ownedAsset = currentPlayer.getOwnedAsset(asset);
            const label = ownedAsset !== undefined ? `Sell ${name}` : `Buy ${name}`;
            const icon = document.createElement("i");
            icon.classList.add("bi", asset.isHouse() ? "bi-house-door-fill" : "bi-car-front-fill", "d-block", "mb-1");
            icon.ariaHidden = "true";
            button.replaceChildren(icon, label, document.createElement("br"), `€ ${this.formatNumber(this.getAssetPrice(currentPlayer, asset))}`);
            button.classList.toggle("green", ownedAsset !== undefined);
            button.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        }
        // Same condition as the asset buttons: their modals would open with everything disabled
        this.btnHouses.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        this.btnCars.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        this.btnAuction.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        this.btnLottery.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;

        this.btnSpin.classList.toggle("d-none", currentPlayer.hasPressedSpin);
        const showRoll = game.rolledNumber > 0 && this.rollingAnimationType !== RollingAnimationType.Spin;
        this.playerRoll.classList.toggle("d-none", !showRoll);
        this.playerRollNumber.textContent = showRoll ? `${game.rolledNumber}` : "";

        this.inputSalary.classList.toggle("d-none", this._operation !== Operation.Salary);
        this.btnConfirmSalary.classList.toggle("d-none", this._operation !== Operation.Salary);

        this.inputAuction.classList.toggle("d-none", this._operation !== Operation.Auction);
        this.btnConfirmAuction.classList.toggle("d-none", this._operation !== Operation.Auction);

        const showChance = game.rolledChance >= 0 && this.rollingAnimationType !== RollingAnimationType.TryForAKid;
        this.chanceResult.classList.toggle("d-none", !showChance);
        this.chanceResultNumber.textContent = showChance ? `${game.rolledChance}` : "";

        this.yearsLeft.textContent = `Years left: ${game.years}`;
        this.btnEndTurn.disabled = !currentPlayer.hasPressedSpin;

        this.btnWeddingLabel.textContent = !currentPlayer.married ? "Wedding" : "Anniversary";
        this.btnWedding.classList.toggle("green", currentPlayer.married);
        this.btnWedding.disabled = !currentPlayer.hasPressedSpin;

        this.btnKids.disabled = !currentPlayer.married || !currentPlayer.hasPressedSpin || game.years <= 0;
        this.btnKidsLabel.textContent = currentPlayer.married ? `${currentPlayer.kids} kids` : "Kids";

        if (game.years <= 0) {
            this.btnSpin.disabled = true;
            this.btnAddMoney.disabled = true;
            this.btnRemoveMoney.disabled = true;
            this.btnAddLifePoints.disabled = true;
            this.btnRemoveLifePoints.disabled = true;
            this.btnAddMoney.classList.add("d-none");
            this.btnRemoveMoney.classList.add("d-none");
            this.btnAddLifePoints.classList.add("d-none");
            this.btnRemoveLifePoints.classList.add("d-none");
            this.btnSalary.disabled = true;
            this.btnWedding.disabled = true;
            this.btnChance.disabled = true;
        }
    }

    /**
     * Opens the roll modal to spin
     */
    private playRollAnimation() {
        try {
            this.rollingAnimationType = RollingAnimationType.Spin;
            bootstrap.Modal.getOrCreateInstance(this.rollModal).show();
            this.rollingAnimation = new RollingAnimation(
                game.getCurrentPlayerTurn().modifyRollByCar(1),
                game.getCurrentPlayerTurn().modifyRollByCar(10),
                4,
                game.rolledNumber,
                () => this.onSpinnerEnd()
            );
        }
        catch (e) {
            this.onError(e);
            this.onSpinnerEnd();
        }
    }

    /**
     * Opens the roll modal to try for a chance (also try for a kid, business / auction)
     */
    private playChanceAnimation() {
        try {
            this.rollingAnimationType = RollingAnimationType.TryForAKid;
            bootstrap.Modal.getOrCreateInstance(this.rollModal).show();
            this.rollingAnimation = new RollingAnimation(
                0,
                2,
                10,
                game.rolledChance,
                () => this.onSpinnerEnd()
            );
        }
        catch (e) {
            this.onError(e);
            this.onSpinnerEnd();
        }
    }

    private onSpinnerEnd() {
        this.rollingAnimation = null;
        this.rollingAnimationType = null;
        this.render();
    }

    /**
     * Current value if the player owns the asset (what selling would pay), otherwise its buy cost.
     */
    private getAssetPrice(player: Player, asset: Asset): number {
        const ownedAsset = player.getOwnedAsset(asset);
        return ownedAsset !== undefined ? Math.round(ownedAsset._value) : asset.buyCost;
    }

    private formatNumber(value: number): string {
        return value.toLocaleString("en-US");
    }

    /**
     * Counts the displayed text from "from" to "to" instead of jumping straight to the new
     * value, so an increase/decrease is felt, not just read. A no-op (sets the text directly)
     * when the value hasn't actually changed.
     */
    private animateStatChange(element: HTMLElement, from: number, to: number, formatFn: (value: number) => string) {
        if (from === to) {
            element.textContent = formatFn(to);
            return;
        }
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            element.textContent = formatFn(Math.round(from + (to - from) * eased));
            if (t < 1)
                requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /**
     * Delta toast for a value change (e.g. "+ € 50,000"), see #toast-container.
     */
    private showDeltaToast(message: string, positive: boolean) {
        const toastElement = document.createElement("div");
        toastElement.classList.add("toast", "align-items-center", "border-0", positive ? "toast-positive" : "toast-negative");
        toastElement.setAttribute("role", "status");
        toastElement.setAttribute("aria-live", "polite");
        toastElement.setAttribute("aria-atomic", "true");

        const flex = document.createElement("div");
        flex.classList.add("d-flex");
        const body = document.createElement("div");
        body.classList.add("toast-body", "fw-semibold");
        body.textContent = message;
        flex.appendChild(body);
        toastElement.appendChild(flex);

        this.toastContainer.appendChild(toastElement);
        toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
        new bootstrap.Toast(toastElement, {delay: 5000}).show();
    }

    /**
     * Opens the given operation (or closes it if already open) and moves the focus to its input.
     */
    private toggleOperation(operation: Operation, inputElement: HTMLInputElement) {
        this._operation = this._operation === operation ? Operation.None : operation;
        this.render();
        if (this._operation === operation) {
            inputElement.focus();
            inputElement.select();
        }
    }

    private confirmOperationInput(inputElement: HTMLInputElement, addOperation: Operation, removeOperation: Operation, addFunc: (value: number) => void, removeFunc: (value: number) => void) {
        this.clearError();
        if (this._operation === addOperation || this._operation === removeOperation) {
            let input = parseInt(inputElement.value);
            if (Number.isNaN(input)) {
                this.showError("Invalid input");
                return;
            }
            try {
                if (this._operation === addOperation)
                    addFunc(input);
                else
                    removeFunc(input);
                this._operation = Operation.None;
                inputElement.value = "";
            }
            catch (e) {
                this.onError(e);
            }
        }
        this.render();
    }

    public onError(exception: any) {
        this.showError(`Error: ${exception}`);
        console.log(exception);
    }

    private showError(message: string) {
        this.playError.textContent = message;
        this.playError.classList.remove("d-none");
    }

    private clearError() {
        this.playError.classList.add("d-none");
    }

    /**
     * Opens the confirm modal and runs onConfirm only if the user confirms.
     */
    private confirmAction(message: string, onConfirm: () => void) {
        this.confirmMessage.textContent = message;
        this.confirmCallback = onConfirm;
        bootstrap.Modal.getOrCreateInstance(this.confirmModal).show();
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const playScreenUI = new PlayScreenUI();
