import {Game} from "../Game.js";
import {Player} from "../Player.js";
import {Operation} from "./Operation.js";

export class PlayScreenUI {
    public static playScreen = document.getElementById("play-screen") as HTMLDivElement;
    public static btnGo = document.getElementById("btn-go") as HTMLButtonElement;
    public static btnEndTurn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    public static yearsLeft = document.getElementById("years-left") as HTMLDivElement;
    public static playerName = document.getElementById("player-name") as HTMLDivElement;

    public static playerMoney = document.getElementById("player-money") as HTMLDivElement;
    public static btnAddMoney = document.getElementById("btn-add-money") as HTMLButtonElement;
    public static btnRemoveMoney = document.getElementById("btn-remove-money") as HTMLButtonElement;
    public static inputMoney = document.getElementById("input-money") as HTMLInputElement;
    public static btnConfirmMoney = document.getElementById("btn-confirm-money") as HTMLButtonElement;

    public static playerLifePoints = document.getElementById("player-life-points") as HTMLDivElement;
    public static btnAddLifePoints = document.getElementById("btn-add-life-points") as HTMLButtonElement;
    public static btnRemoveLifePoints = document.getElementById("btn-remove-life-points") as HTMLButtonElement;
    public static inputLifePoints = document.getElementById("input-life-points") as HTMLInputElement;
    public static btnConfirmLifePoints = document.getElementById("btn-confirm-life-points") as HTMLButtonElement;

    private static _operation: Operation = Operation.None;

    public static init() {
        PlayScreenUI.btnGo.addEventListener("click", () => {
            try {
                Game.getCurrentPlayerTurn().onGo();
            }
            catch (e) {
                alert(`Error: ${e}`);
            }
            PlayScreenUI.render();
        });
        PlayScreenUI.btnEndTurn.addEventListener("click", () => {
            try {
                Game.endTurn();
            }
            catch (e) {
                alert(`Error: ${e}`);
            }
            PlayScreenUI._operation = Operation.None;
            PlayScreenUI.inputMoney.value = "";
            PlayScreenUI.inputLifePoints.value = "";
            PlayScreenUI.render();
        });
        PlayScreenUI.btnAddMoney.addEventListener("click", () => {
            PlayScreenUI._operation = PlayScreenUI._operation === Operation.AddMoney ? Operation.None : Operation.AddMoney;
            PlayScreenUI.render();
        });
        PlayScreenUI.btnRemoveMoney.addEventListener("click", () => {
            PlayScreenUI._operation = PlayScreenUI._operation === Operation.RemoveMoney ? Operation.None : Operation.RemoveMoney;
            PlayScreenUI.render();
        });
        PlayScreenUI.btnAddLifePoints.addEventListener("click", () => {
            PlayScreenUI._operation = PlayScreenUI._operation === Operation.AddLifePoints ? Operation.None : Operation.AddLifePoints;
            PlayScreenUI.render();
        });
        PlayScreenUI.btnRemoveLifePoints.addEventListener("click", () => {
            PlayScreenUI._operation = PlayScreenUI._operation === Operation.RemoveLifePoints ? Operation.None : Operation.RemoveLifePoints;
            PlayScreenUI.render();
        });
        PlayScreenUI.btnConfirmMoney.addEventListener("click", () => {
            PlayScreenUI.confirmOperationInput(PlayScreenUI.inputMoney, Operation.AddMoney, Operation.RemoveMoney, (v) => Game.getCurrentPlayerTurn().addMoney(v), (v) => Game.getCurrentPlayerTurn().removeMoney(v));
        });
        PlayScreenUI.btnConfirmLifePoints.addEventListener("click", () => {
            PlayScreenUI.confirmOperationInput(PlayScreenUI.inputLifePoints, Operation.AddLifePoints, Operation.RemoveLifePoints, (v) => Game.getCurrentPlayerTurn().addLifePoints(v), (v) => Game.getCurrentPlayerTurn().removeLifePoints(v));
        });
    }

    public static render() {
        const currentPlayer: Player = Game.getCurrentPlayerTurn();

        if (Game.years <= 0)
            PlayScreenUI.playerName.textContent = `Vincitore: ${Game.getCurrentPlayerTurn().name}`;
        else
            PlayScreenUI.playerName.textContent = currentPlayer.name;

        if (Game.years <= 0)
            PlayScreenUI.playerMoney.textContent = "";
        else
            PlayScreenUI.playerMoney.textContent = `€ ${currentPlayer.money}`;
        PlayScreenUI.playerLifePoints.textContent = `♥ ${currentPlayer.lifePoints}`;

        const moneyOpen: boolean = PlayScreenUI._operation === Operation.AddMoney || PlayScreenUI._operation === Operation.RemoveMoney;
        const lifePointsOpen: boolean = PlayScreenUI._operation === Operation.AddLifePoints || PlayScreenUI._operation === Operation.RemoveLifePoints;
        PlayScreenUI.inputMoney.classList.toggle("d-none", !moneyOpen);
        PlayScreenUI.btnConfirmMoney.classList.toggle("d-none", !moneyOpen);
        PlayScreenUI.inputLifePoints.classList.toggle("d-none", !lifePointsOpen);
        PlayScreenUI.btnConfirmLifePoints.classList.toggle("d-none", !lifePointsOpen);

        PlayScreenUI.btnGo.disabled = currentPlayer.hasPressedGo;

        PlayScreenUI.yearsLeft.textContent = `Anni rimanenti: ${Game.years}`;
        PlayScreenUI.btnEndTurn.disabled = !currentPlayer.hasPressedGo;


        if (Game.years <= 0) {
            PlayScreenUI.btnGo.disabled = true;
            PlayScreenUI.btnAddMoney.disabled = true;
            PlayScreenUI.btnRemoveMoney.disabled = true;
            PlayScreenUI.btnAddLifePoints.disabled = true;
            PlayScreenUI.btnRemoveLifePoints.disabled = true;
            PlayScreenUI.btnAddMoney.classList.add("d-none");
            PlayScreenUI.btnRemoveMoney.classList.add("d-none");
            PlayScreenUI.btnAddLifePoints.classList.add("d-none");
            PlayScreenUI.btnRemoveLifePoints.classList.add("d-none");
        }
    }

    private static confirmOperationInput(inputElement: HTMLInputElement, addOperation: Operation, removeOperation: Operation, addFunc: (value: number) => void, removeFunc: (value: number) => void) {
        if (PlayScreenUI._operation === addOperation || PlayScreenUI._operation === removeOperation) {
            let input = parseInt(inputElement.value);
            if (Number.isNaN(input)) {
                alert("Valore non valido");
                return;
            }
            try {
                if (PlayScreenUI._operation === addOperation)
                    addFunc(input);
                else
                    removeFunc(input);
                PlayScreenUI._operation = Operation.None;
                inputElement.value = "";
            }
            catch (e) {
                alert(`Error: ${e}`);
            }
        }
        PlayScreenUI.render();
    }
}

PlayScreenUI.init();

