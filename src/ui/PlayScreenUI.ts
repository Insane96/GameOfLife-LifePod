import {Game} from "../Game.js";
import {Player} from "../Player.js";
import {Operation} from "./Operation.js";

class PlayScreenUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    private btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
    private btnEndTurn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    private yearsLeft = document.getElementById("years-left") as HTMLDivElement;
    private playerName = document.getElementById("player-name") as HTMLDivElement;

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

    constructor() {
        this.btnSpin.addEventListener("click", () => {
            try {
                Game.getCurrentPlayerTurn().onSpin();
                alert(`Rolled ${Game.rolledNumber}`);
            }
            catch (e) {
                alert(`Error: ${e}`);
            }
            this.render();
        });
        this.btnEndTurn.addEventListener("click", () => {
            try {
                Game.endTurn();
            }
            catch (e) {
                alert(`Error: ${e}`);
            }
            this._operation = Operation.None;
            this.inputMoney.value = "";
            this.inputLifePoints.value = "";
            this.render();
        });
        this.btnAddMoney.addEventListener("click", () => {
            this._operation = this._operation === Operation.AddMoney ? Operation.None : Operation.AddMoney;
            this.render();
        });
        this.btnRemoveMoney.addEventListener("click", () => {
            this._operation = this._operation === Operation.RemoveMoney ? Operation.None : Operation.RemoveMoney;
            this.render();
        });
        this.btnAddLifePoints.addEventListener("click", () => {
            this._operation = this._operation === Operation.AddLifePoints ? Operation.None : Operation.AddLifePoints;
            this.render();
        });
        this.btnRemoveLifePoints.addEventListener("click", () => {
            this._operation = this._operation === Operation.RemoveLifePoints ? Operation.None : Operation.RemoveLifePoints;
            this.render();
        });
        this.btnConfirmMoney.addEventListener("click", () => {
            this.confirmOperationInput(this.inputMoney, Operation.AddMoney, Operation.RemoveMoney, (v) => Game.getCurrentPlayerTurn().addMoney(v), (v) => Game.getCurrentPlayerTurn().removeMoney(v));
        });
        this.btnConfirmLifePoints.addEventListener("click", () => {
            this.confirmOperationInput(this.inputLifePoints, Operation.AddLifePoints, Operation.RemoveLifePoints, (v) => Game.getCurrentPlayerTurn().addLifePoints(v), (v) => Game.getCurrentPlayerTurn().removeLifePoints(v));
        });
    }

    public render() {
        const currentPlayer: Player = Game.getCurrentPlayerTurn();

        if (Game.years <= 0)
            this.playerName.textContent = `Winner: ${Game.getCurrentPlayerTurn().name}`;
        else
            this.playerName.textContent = currentPlayer.name;

        if (Game.years <= 0)
            this.playerMoney.textContent = "";
        else
            this.playerMoney.textContent = `€ ${currentPlayer.money}`;
        this.playerLifePoints.textContent = `♥ ${currentPlayer.lifePoints}`;

        const moneyOpen: boolean = this._operation === Operation.AddMoney || this._operation === Operation.RemoveMoney;
        const lifePointsOpen: boolean = this._operation === Operation.AddLifePoints || this._operation === Operation.RemoveLifePoints;
        this.inputMoney.classList.toggle("d-none", !moneyOpen);
        this.btnConfirmMoney.classList.toggle("d-none", !moneyOpen);
        this.inputLifePoints.classList.toggle("d-none", !lifePointsOpen);
        this.btnConfirmLifePoints.classList.toggle("d-none", !lifePointsOpen);

        this.btnSpin.disabled = currentPlayer.hasPressedSpin;

        this.yearsLeft.textContent = `Years left: ${Game.years}`;
        this.btnEndTurn.disabled = !currentPlayer.hasPressedSpin;


        if (Game.years <= 0) {
            this.btnSpin.disabled = true;
            this.btnAddMoney.disabled = true;
            this.btnRemoveMoney.disabled = true;
            this.btnAddLifePoints.disabled = true;
            this.btnRemoveLifePoints.disabled = true;
            this.btnAddMoney.classList.add("d-none");
            this.btnRemoveMoney.classList.add("d-none");
            this.btnAddLifePoints.classList.add("d-none");
            this.btnRemoveLifePoints.classList.add("d-none");
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
                alert(`Error: ${e}`);
            }
        }
        this.render();
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const playScreenUI = new PlayScreenUI();
