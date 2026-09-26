import {game} from "../Game.js";
import {Player} from "../Player.js";
import {Asset} from "../Asset.js";
import {Operation} from "./Operation.js";
import {RollingAnimation} from "./RollingAnimation.js";

// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void } };
};

class PlayScreenUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    private btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
    private btnEndTurn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    private yearsLeft = document.getElementById("years-left") as HTMLDivElement;
    private playerName = document.getElementById("player-name") as HTMLDivElement;
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
    private rollModal = document.getElementById("roll-modal") as HTMLDivElement;
    private rollingAnimation: RollingAnimation | null = null;

    private btnChance = document.getElementById("btn-chance") as HTMLButtonElement;
    private chanceResult = document.getElementById("chance-result") as HTMLDivElement;

    private btnWedding = document.getElementById("btn-wedding") as HTMLButtonElement;
    private btnKids = document.getElementById("btn-kids") as HTMLButtonElement;
    private btn1Kid = document.getElementById("btn-1-kid") as HTMLButtonElement;
    private btn2Kids = document.getElementById("btn-2-kids") as HTMLButtonElement;
    private btnTryKid = document.getElementById("btn-try-kid") as HTMLButtonElement;

    private btnHouses = document.getElementById("btn-houses") as HTMLButtonElement;
    private btnCars = document.getElementById("btn-cars") as HTMLButtonElement;
    private assetButtons: {button: HTMLButtonElement, asset: Asset, name: string}[] = [
        {button: document.getElementById("btn-house-small") as HTMLButtonElement, asset: Asset.SmallHouse, name: "Modest House"},
        {button: document.getElementById("btn-house-medium") as HTMLButtonElement, asset: Asset.MediumHouse, name: "Mid-sized House"},
        {button: document.getElementById("btn-house-large") as HTMLButtonElement, asset: Asset.BigHouse, name: "Mansion"},
        {button: document.getElementById("btn-car-economy") as HTMLButtonElement, asset: Asset.EconomyCar, name: "Economy Car"},
        {button: document.getElementById("btn-car-luxury") as HTMLButtonElement, asset: Asset.LuxuryCar, name: "Luxury Car"},
    ];

    constructor() {
        this.btnSpin.addEventListener("click", () => {
            let spun: boolean = false;
            try {
                game.getCurrentPlayerTurn().onSpin();
                spun = true;
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
            if (spun)
                this.playRollAnimation();
        });
        // Blocks closing (click outside, Esc) until the animation is over
        this.rollModal.addEventListener("hide.bs.modal", (event) => {
            if (this.rollingAnimation !== null)
                event.preventDefault();
        });
        this.btnEndTurn.addEventListener("click", () => {
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
        this.btnAddLifePoints.addEventListener("click", () => {
            this.toggleOperation(Operation.AddLifePoints, this.inputLifePoints);
        });
        this.btnRemoveLifePoints.addEventListener("click", () => {
            this.toggleOperation(Operation.RemoveLifePoints, this.inputLifePoints);
        });
        this.btnConfirmLifePoints.addEventListener("click", () => {
            this.confirmOperationInput(this.inputLifePoints, Operation.AddLifePoints, Operation.RemoveLifePoints, (v) => game.getCurrentPlayerTurn().addLifePoints(v), (v) => game.getCurrentPlayerTurn().removeLifePoints(v));
        });
        this.btnChance.addEventListener("click", () => {
            game.rollAndSetChance();
            this.render();
        });
        this.btnSalary.addEventListener("click", () => {
            this.inputSalary.value = String(game.getCurrentPlayerTurn().salary);
            this.toggleOperation(Operation.Salary, this.inputSalary);
        });
        this.btnConfirmSalary.addEventListener("click", () => {
            let input = parseInt(this.inputSalary.value);
            if (Number.isNaN(input)) {
                alert("Invalid input");
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
        this.btnAuction.addEventListener("click", () => {
            this.toggleOperation(Operation.Auction, this.inputAuction);
        });
        this.btnConfirmAuction.addEventListener("click", () => {
            let input = parseInt(this.inputAuction.value);
            if (Number.isNaN(input)) {
                alert("Invalid input");
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
            this.render();
        });
        this.btnWedding.addEventListener("click", () => {
            if (confirm("Confirm Wedding/Anniversary?"))
                game.getCurrentPlayerTurn().getMarried();
            this.render();
        });
        this.btnKids.addEventListener("click", () => {

        });
        this.btn1Kid.addEventListener("click", () => {
            try {
                game.getCurrentPlayerTurn().addKids(1);
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        this.btn2Kids.addEventListener("click", () => {
            try {
                game.getCurrentPlayerTurn().addKids(2);
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        this.btnTryKid.addEventListener("click", () => {
            try {
                game.getCurrentPlayerTurn().tryForAKid();
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        for (const {button, asset, name} of this.assetButtons) {
            button.addEventListener("click", () => {
                const player = game.getCurrentPlayerTurn();
                const price = this.formatNumber(this.getAssetPrice(player, asset));
                try {
                    if (player.hasAsset(asset)) {
                        if (confirm(`Sell ${name} for € ${price}?`))
                            player.sellAsset(asset);
                    }
                    else
                        player.buyAsset(asset);
                }
                catch (e) {
                    this.onError(e);
                }
                this.render();
            });
        }
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
        }
        else {
            this.playerMoney.textContent = `€ ${this.formatNumber(currentPlayer.money)}`;
            this.playerLifePoints.textContent = `♥ ${this.formatNumber(currentPlayer.lifePoints)}`;
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
            button.replaceChildren(label, document.createElement("br"), `€ ${this.formatNumber(this.getAssetPrice(currentPlayer, asset))}`);
            button.classList.toggle("green", ownedAsset !== undefined);
            button.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        }
        // Same condition as the asset buttons: their modals would open with everything disabled
        this.btnHouses.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;
        this.btnCars.disabled = !currentPlayer.hasPressedSpin || game.years <= 0;

        this.btnSpin.classList.toggle("d-none", currentPlayer.hasPressedSpin);
        if (game.rolledNumber > 0 && this.rollingAnimation === null)
            this.playerRoll.textContent = `Rolled: ${game.rolledNumber}`;
        else
            this.playerRoll.textContent = "";

        this.inputSalary.classList.toggle("d-none", this._operation !== Operation.Salary);
        this.btnConfirmSalary.classList.toggle("d-none", this._operation !== Operation.Salary);

        this.inputAuction.classList.toggle("d-none", this._operation !== Operation.Auction);
        this.btnConfirmAuction.classList.toggle("d-none", this._operation !== Operation.Auction);

        if (game.rolledChance >= 0)
            this.chanceResult.textContent = `Chance: ${game.rolledChance}`;
        else
            this.chanceResult.textContent = "";

        this.yearsLeft.textContent = `Years left: ${game.years}`;
        this.btnEndTurn.disabled = !currentPlayer.hasPressedSpin;

        this.btnWedding.textContent = !currentPlayer.married ? "Wedding" : "Anniversary";
        this.btnWedding.classList.toggle("green", currentPlayer.married);
        this.btnWedding.disabled = !currentPlayer.hasPressedSpin;

        this.btnKids.disabled = !currentPlayer.married;
        if (!this.btnKids.disabled)
            this.btnKids.textContent = `${currentPlayer.kids} kids`;

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
            this.btnAuction.disabled = true;
            this.btnWedding.disabled = true;
        }
    }

    /**
     * Opens the roll modal
     */
    private playRollAnimation() {
        try {
            bootstrap.Modal.getOrCreateInstance(this.rollModal).show();
            this.rollingAnimation = new RollingAnimation(game.getCurrentPlayerTurn().modifyRollByCar(1), game.getCurrentPlayerTurn().modifyRollByCar(10), 4, game.rolledNumber, () => {
                this.rollingAnimation = null;
            });
        }
        catch (e) {
            this.onError(e);
        }
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
        if (this._operation === addOperation || this._operation === removeOperation) {
            let input = parseInt(inputElement.value);
            if (Number.isNaN(input)) {
                alert("Invalid input");
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
        alert(`Error: ${exception}`);
        console.log(exception);
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const playScreenUI = new PlayScreenUI();
