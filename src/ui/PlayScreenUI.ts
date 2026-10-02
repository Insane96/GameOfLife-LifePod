import {game} from "../Game.js";
import {Player, StatBreakdown, StatStep, StatStepLabel} from "../Player.js";
import {Asset} from "../Asset.js";
import {PlayerColor} from "../PlayerColor.js";
import {Operation} from "./Operation.js";
import {RollingAnimation} from "./RollingAnimation.js";
import {sounds} from "./Sounds.js";
import {confirmModal} from "./ConfirmModal.js";
import {persistence} from "../Persistence.js";
import {globalUI} from "./GlobalUI.js";
import {confetti} from "./Confetti.js";
import {i18n, t} from "../i18n/I18n.js";
import {GameError} from "../GameError.js";
import type {TranslationKey} from "../i18n/en.js";

// Minimal typing for the Bootstrap bundle loaded with a <script> tag (no @types/bootstrap)
declare const bootstrap: {
    Modal: { getOrCreateInstance(element: Element): { show(): void } };
    Toast: new (element: Element, options?: {delay?: number}) => { show(): void; hide(): void };
};

// Display text of each StatStep label, shown as the "(category)" suffix of the delta toasts.
// Record: a new label added to StatStepLabel without a translation is a compile error.
const STAT_STEP_LABEL_KEYS: Record<Exclude<StatStepLabel, "">, TranslationKey> = {
    "salary": "step.salary",
    "rent": "step.rent",
    "kids": "step.kids",
    "debts": "step.debts",
    "houses": "step.houses",
    "cars": "step.cars",
    "wedding": "step.wedding",
    "anniversary": "step.anniversary",
    "gifts": "step.gifts",
    "baby": "step.baby",
    "twins": "step.twins",
    "auction lost": "step.auctionLost",
    "auction won": "step.auctionWon",
};

enum RollingAnimationType {
    Spin,
    TryForAKid,
    BusinessAuction
}

class PlayScreenUI {
    private playScreen = document.getElementById("play-screen") as HTMLDivElement;
    // Two containers anchored to the sticky money/LP row (see index.html), one just below it
    // (shown in portrait, where the row sticks to the top) and one just above it (shown in
    // landscape, where the row sits in the middle): whichever is currently visible is picked at
    // toast-creation time, see getActiveToastContainer().
    private toastContainerPortrait = document.getElementById("toast-container-portrait") as HTMLDivElement;
    private toastContainerLandscape = document.getElementById("toast-container-landscape") as HTMLDivElement;
    private startScreen = document.getElementById("start-screen") as HTMLDivElement;
    private btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
    private btnEndTurn = document.getElementById("btn-end-turn") as HTMLButtonElement;
    private btnUndo = document.getElementById("btn-undo") as HTMLButtonElement;
    private btnMenu = document.getElementById("btn-menu") as HTMLButtonElement;
    private btnYearsLeft = document.getElementById("btn-years-left") as HTMLButtonElement;
    private yearsLeftValue = document.getElementById("years-left-value") as HTMLSpanElement;
    private inputYearsLeft = document.getElementById("input-years-left") as HTMLInputElement;
    private btnConfirmYearsLeft = document.getElementById("btn-confirm-years-left") as HTMLButtonElement;
    // Set by btnYearsLeft's pointerdown, cleared by whichever of pointerup/pointerleave/
    // pointercancel comes first: only a hold that survives the full delay opens the operation
    // (see the constructor), so a normal tap/click still does nothing to it.
    private yearsLeftPressTimer: ReturnType<typeof setTimeout> | null = null;
    private playerName = document.getElementById("player-name") as HTMLDivElement;
    private playError = document.getElementById("play-error") as HTMLDivElement;
    private playerScoreboard = document.getElementById("player-scoreboard") as HTMLTableSectionElement;
    private playerScoreboardHeader = document.getElementById("player-scoreboard-header") as HTMLTableSectionElement;

    private playerMoney = document.getElementById("player-money") as HTMLDivElement;
    private playerMoneyLabel = document.getElementById("player-money-label") as HTMLDivElement;
    private btnAddMoney = document.getElementById("btn-add-money") as HTMLButtonElement;
    private btnRemoveMoney = document.getElementById("btn-remove-money") as HTMLButtonElement;
    private inputMoney = document.getElementById("input-money") as HTMLInputElement;
    private btnConfirmMoney = document.getElementById("btn-confirm-money") as HTMLButtonElement;

    private playerLifePoints = document.getElementById("player-life-points") as HTMLDivElement;
    private playerLifePointsLabel = document.getElementById("player-life-points-label") as HTMLDivElement;
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
    // True while the wedding march plays, before money and Life Points are added (see btnWedding)
    private weddingTunePlaying = false;
    // Tracks modal open/close via Bootstrap's own events (fired the instant show()/hide() is
    // called) instead of querying ".modal.show" in the animation loop: that class is only added
    // once the backdrop's own fade-in has already finished, so a class-based check misses the
    // whole backdrop fade and lets the count-up run unpaused during it.
    // A counter, not a boolean: e.g. Try for a kid closes kids-modal (data-bs-dismiss) right as
    // it opens roll-modal, so kids-modal's own hidden.bs.modal (~150ms later, once its fade-out
    // ends) would otherwise flip this back to "no modal open" while roll-modal is still up.
    private openModalCount: number = 0;

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
    private assetButtons: {button: HTMLButtonElement, asset: Asset, nameKey: TranslationKey}[] = [
        {button: document.getElementById("btn-house-small") as HTMLButtonElement, asset: Asset.SmallHouse, nameKey: "houses.small"},
        {button: document.getElementById("btn-house-medium") as HTMLButtonElement, asset: Asset.MediumHouse, nameKey: "houses.medium"},
        {button: document.getElementById("btn-house-large") as HTMLButtonElement, asset: Asset.BigHouse, nameKey: "houses.large"},
        {button: document.getElementById("btn-car-economy") as HTMLButtonElement, asset: Asset.EconomyCar, nameKey: "cars.economy"},
        {button: document.getElementById("btn-car-luxury") as HTMLButtonElement, asset: Asset.LuxuryCar, nameKey: "cars.luxury"},
    ];

    // Snapshot of the last money/Life Points shown for the current player, so render() can tell
    // a real change (worth a count-up animation and a delta toast) from a turn change or a
    // re-render triggered by something else (e.g. opening an operation).
    private statsPlayer: Player | null = null;
    private lastMoney: number = 0;
    private lastLifePoints: number = 0;

    // End-of-game scoreboard reveal (see revealScoreboard()): scoreboardAnimated guards against
    // re-running the reveal on every render() call while sitting on the end screen (e.g. a
    // window resize). scoreboardRevealId is bumped every time the scoreboard is cleared (a fresh
    // reveal starting, or Undo taking the game back below game.years <= 0 mid-animation) so a
    // reveal still in flight can tell it's stale and stop touching the DOM.
    private scoreboardAnimated: boolean = false;
    private scoreboardRevealId: number = 0;

    // Try for a kid/Auction already know their outcome (rollAndSetChance() resolves it
    // immediately) before the suspense of the roll animation plays out, so the breakdown/message
    // they'll show once it ends is stashed here instead of passed straight to render(), unlike
    // Spin (see render()'s onStatsSettled/breakdown, animated up front instead).
    private pendingBreakdown: StatBreakdown | null = null;
    private pendingInfoMessage: string | null = null;

    constructor() {
        document.addEventListener("show.bs.modal", () => { this.openModalCount++; });
        document.addEventListener("hidden.bs.modal", () => { this.openModalCount = Math.max(0, this.openModalCount - 1); });
        this.btnSpin.addEventListener("click", () => {
            this.clearError();
            let breakdown: StatBreakdown | null = null;
            try {
                breakdown = game.getCurrentPlayerTurn().onSpin();
            }
            catch (e) {
                this.onError(e);
            }
            if (breakdown !== null) {
                // Hides the roll number and blocks other actions (see the "busy" checks in
                // render()) until playRollAnimation() actually opens the modal, once money/Life
                // Points have finished animating below.
                this.rollingAnimationType = RollingAnimationType.Spin;
                this.render(() => this.playRollAnimation(), breakdown);
            }
            else
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
            this.inputYearsLeft.value = "";
            this.toastContainerPortrait.replaceChildren();
            this.toastContainerLandscape.replaceChildren();
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
                this.showError(t("error.invalidInput"));
                return;
            }
            const player = game.getCurrentPlayerTurn();
            const oldSalary = player.salary;
            try {
                player.salary = input;
            }
            catch (e) {
                this.onError(e);
                return;
            }
            if (input > oldSalary)
                sounds.play("salaryUp");
            else if (input < oldSalary)
                sounds.play("salaryDown");
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
                this.showError(t("error.invalidInput"));
                return;
            }
            let steps: StatStep[];
            try {
                steps = game.getCurrentPlayerTurn().bid(input);
            }
            catch (e) {
                this.onError(e);
                return;
            }
            this._operation = Operation.None;
            this.inputAuction.value = "";
            this.pendingBreakdown = {money: steps, lifePoints: []};
            if (steps.length === 0)
                this.pendingInfoMessage = t("info.bidNothing");
            this.playChanceAnimation();
        });
        this.inputAuction.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmAuction.click();
        });
        // Years left opens its input on a press-and-hold (not a click, which does nothing) so a
        // normal tap doesn't risk nudging the game's remaining length by accident.
        const openYearsLeftOperation = () => {
            this.inputYearsLeft.value = String(game.years);
            this.toggleOperation(Operation.YearsLeft, this.inputYearsLeft);
        };
        this.btnYearsLeft.addEventListener("pointerdown", () => {
            this.yearsLeftPressTimer = setTimeout(() => {
                this.yearsLeftPressTimer = null;
                openYearsLeftOperation();
            }, 500);
        });
        const cancelYearsLeftPress = () => {
            if (this.yearsLeftPressTimer !== null) {
                clearTimeout(this.yearsLeftPressTimer);
                this.yearsLeftPressTimer = null;
            }
        };
        this.btnYearsLeft.addEventListener("pointerup", cancelYearsLeftPress);
        this.btnYearsLeft.addEventListener("pointerleave", cancelYearsLeftPress);
        this.btnYearsLeft.addEventListener("pointercancel", cancelYearsLeftPress);
        // Keyboard/assistive tech has no equivalent of "hold": Enter/Space opens it right away.
        this.btnYearsLeft.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                // preventDefault also suppresses the native click, so GlobalUI's beep has to be played here
                event.preventDefault();
                sounds.play("beep");
                openYearsLeftOperation();
            }
        });
        this.btnConfirmYearsLeft.addEventListener("click", () => {
            this.clearError();
            let input = parseInt(this.inputYearsLeft.value);
            if (Number.isNaN(input)) {
                this.showError(t("error.invalidInput"));
                return;
            }
            try {
                game.setYearsLeft(input);
                this._operation = Operation.None;
                this.inputYearsLeft.value = "";
            }
            catch (e) {
                this.onError(e);
            }
            this.render();
        });
        this.inputYearsLeft.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                this.btnConfirmYearsLeft.click();
        });
        this.btnWedding.addEventListener("click", () => {
            confirmModal.confirm(t(!game.getCurrentPlayerTurn().married ? "confirm.wedding" : "confirm.anniversary"), () => {
                // The march plays first and money/Life Points are added once it's over; meanwhile
                // the other buttons are blocked (see "busy" in render())
                this.weddingTunePlaying = true;
                this.render();
                setTimeout(() => {
                    this.weddingTunePlaying = false;
                    const breakdown = game.getCurrentPlayerTurn().getMarried();
                    this.render(undefined, breakdown);
                }, sounds.play("wedding") * 1000);
            });
        });
        this.btnKids.addEventListener("click", () => {

        });
        this.btn1Kid.addEventListener("click", () => {
            this.clearError();
            try {
                const steps = game.getCurrentPlayerTurn().addKids(1);
                this.render(undefined, {money: [], lifePoints: steps});
            }
            catch (e) {
                this.onError(e);
                this.render();
            }
        });
        this.btn2Kids.addEventListener("click", () => {
            this.clearError();
            try {
                const steps = game.getCurrentPlayerTurn().addKids(2);
                this.render(undefined, {money: [], lifePoints: steps});
            }
            catch (e) {
                this.onError(e);
                this.render();
            }
        });
        this.btnTryKid.addEventListener("click", () => {
            this.clearError();
            let failed = false;
            let steps: StatStep[] = [];
            try {
                steps = game.getCurrentPlayerTurn().tryForAKid();
            }
            catch (e) {
                this.onError(e);
                failed = true;
            }
            if (!failed) {
                this.pendingBreakdown = {money: [], lifePoints: steps};
                if (steps.length === 0)
                    this.pendingInfoMessage = t("info.betterLuck");
                this.playChanceAnimation();
            }
        });
        for (const {button, asset, nameKey} of this.assetButtons) {
            button.addEventListener("click", () => {
                this.clearError();
                const player = game.getCurrentPlayerTurn();
                const price = this.formatNumber(this.getAssetPrice(player, asset));
                if (player.hasAsset(asset)) {
                    confirmModal.confirm(t("confirm.sell", {name: t(nameKey), price}), () => {
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
        this.btnUndo.addEventListener("click", () => {
            this.clearError();
            if (!persistence.undo())
                return;
            this._operation = Operation.None;
            this.inputSalary.value = String(game.getCurrentPlayerTurn().salary);
            this.inputMoney.value = "";
            this.inputLifePoints.value = "";
            this.inputAuction.value = "";
            this.inputYearsLeft.value = "";
            this.toastContainerPortrait.replaceChildren();
            this.toastContainerLandscape.replaceChildren();
            this.render();
        });
        this.btnMenu.addEventListener("click", () => {
            // Defensive: render() already saves after every model change, but this covers the
            // unlikely case of a click landing before that save has run.
            persistence.save();
            this._operation = Operation.None;
            this.playScreen.classList.add("d-none");
            this.startScreen.classList.remove("d-none");
            // btn-continue only gets (re-)enabled here and at page load (see MainMenuUI): a
            // brand new game's first save happens after this point, so it may still be disabled
            // from before this session's very first save.
            const btnContinue = document.getElementById("btn-continue") as HTMLButtonElement;
            btnContinue.disabled = !persistence.hasSavedGame();
            globalUI.render();
        });
    }

    /**
     * @param onStatsSettled called once the money/Life Points animation below is done (right
     * away if there was nothing to animate). Callers that need to open a modal right after a
     * stat change (Spin, Chance, Try for a kid, Auction) pass it instead of opening the modal
     * themselves, so the animation is never covered by a modal that's already sliding in.
     * @param breakdown a per-category breakdown (Spin, Wedding, Kids, Auction; see StatBreakdown),
     * animated step by step with its own labelled toast instead of the usual single unlabelled
     * lump sum (see animateStatSteps). Actions without one (manual +/-, assets, salary) still just
     * move the total in one go, like before.
     */
    public render(onStatsSettled?: () => void, breakdown?: StatBreakdown) {
        const currentPlayer: Player = game.getCurrentPlayerTurn();

        this.playerScoreboardHeader.classList.toggle("d-none", game.years > 0);
        if (game.years <= 0) {
            this.playerName.textContent = "";
            if (!this.scoreboardAnimated) {
                this.scoreboardAnimated = true;
                this.playerScoreboard.replaceChildren();
                // The end-of-game tune plays first, then the Life Points are counted up; the
                // revealId check at the top of revealScoreboard covers an Undo during the tune
                const revealId = ++this.scoreboardRevealId;
                setTimeout(() => this.revealScoreboard(game.getRanking(), revealId), sounds.play("gameEndTune") * 1000);
            }
        }
        else {
            this.playerName.textContent = currentPlayer.name;
            this.playerScoreboard.replaceChildren();
            this.scoreboardAnimated = false;
            this.scoreboardRevealId++;
        }

        if (game.years <= 0) {
            this.playerMoney.textContent = "";
            this.playerLifePoints.textContent = "";
            this.playerMoneyLabel.classList.add("d-none");
            this.playerLifePointsLabel.classList.add("d-none");
            this.playScreen.removeAttribute("data-player-color");
            this.statsPlayer = null;
            onStatsSettled?.();
        }
        else {
            this.playerMoneyLabel.classList.remove("d-none");
            this.playerLifePointsLabel.classList.remove("d-none");
            this.playScreen.dataset.playerColor = PlayerColor[currentPlayer.color];

            const samePlayer = this.statsPlayer === currentPlayer;
            const fromMoney = samePlayer ? this.lastMoney : currentPlayer.money;
            const fromLifePoints = samePlayer ? this.lastLifePoints : currentPlayer.lifePoints;
            const toMoney = currentPlayer.money;
            const toLifePoints = currentPlayer.lifePoints;

            this.statsPlayer = currentPlayer;
            this.lastMoney = toMoney;
            this.lastLifePoints = toLifePoints;

            // Spin reports its change broken down by category (salary, houses, cars; then
            // houses/cars/wedding/kids for Life Points — see Player.onSpin()); Wedding/Kids/
            // Auction report a single labelled step (see getMarried/addKids/bid). Every other
            // action still just moves the total in one unlabelled lump, like before (label ""
            // so animateStatSteps shows no "(category)" suffix on its toast).
            const moneySteps: StatStep[] = samePlayer && breakdown
                ? breakdown.money
                : [{label: "", amount: toMoney - fromMoney}];
            const lifePointsSteps: StatStep[] = samePlayer && breakdown
                ? breakdown.lifePoints
                : [{label: "", amount: toLifePoints - fromLifePoints}];

            // Like the physical Lifepod: money counts up first (through each of its categories),
            // then Life Points, then (via onStatsSettled) the roll/chance modal opens.
            // animateStatSteps/animateStatChange no-op straight through a step whose amount is 0
            // (e.g. no houses owned), so nothing pauses on an empty category. Only Spin has more
            // than one step to chain through (its zero-amount categories included), which is what
            // the "spin" argument of animateStatSteps keys off: a fixed duration for "salary" and
            // no end-of-count sound. Every other step gets a duration scaled on its amount,
            // between the thresholds passed here (see getStepDuration).
            const moneyAnimated = moneySteps.some(s => s.amount !== 0);
            this.animateStatSteps(this.playerMoney, fromMoney, moneySteps, "€", (v) => `€ ${this.formatNumber(v)}`, moneySteps.length > 1, [10000, 1000000], () => {
                const startLifePoints = () => this.animateStatSteps(this.playerLifePoints, fromLifePoints, lifePointsSteps, "♥", (v) => `♥ ${this.formatNumber(v)}`, lifePointsSteps.length > 1, [200, 2000], onStatsSettled);
                // Half a second of breathing room between the money and Life Points animations,
                // but only when money actually animated something (see animateStatSteps for the
                // same rule between categories within one stat).
                if (moneyAnimated)
                    setTimeout(startLifePoints, 500);
                else
                    startLifePoints();
            });
        }

        const moneyOpen: boolean = this._operation === Operation.AddMoney || this._operation === Operation.RemoveMoney;
        const lifePointsOpen: boolean = this._operation === Operation.AddLifePoints || this._operation === Operation.RemoveLifePoints;
        this.inputMoney.classList.toggle("d-none", !moneyOpen);
        this.btnConfirmMoney.classList.toggle("d-none", !moneyOpen);
        this.inputLifePoints.classList.toggle("d-none", !lifePointsOpen);
        this.btnConfirmLifePoints.classList.toggle("d-none", !lifePointsOpen);

        // True from the moment Spin/Chance/Try for a kid/Auction is pressed until their roll
        // modal actually closes, including the money/Life Points animation before it opens: the
        // modal's own backdrop can't block these buttons during that gap, so this does instead.
        // Also true while the wedding march plays, before the gifts are added.
        const busy = this.rollingAnimationType !== null || this.weddingTunePlaying;

        for (const {button, asset, nameKey} of this.assetButtons) {
            const ownedAsset = currentPlayer.getOwnedAsset(asset);
            const label = t(ownedAsset !== undefined ? "asset.sell" : "asset.buy", {name: t(nameKey)});
            const icon = document.createElement("i");
            icon.classList.add("bi", asset.isHouse() ? "bi-house-door-fill" : "bi-car-front-fill", "d-block", "mb-1");
            icon.ariaHidden = "true";
            button.replaceChildren(icon, label, document.createElement("br"), `€ ${this.formatNumber(this.getAssetPrice(currentPlayer, asset))}`);
            this.setOwnedStyle(button, ownedAsset !== undefined);
            button.disabled = !currentPlayer.hasPressedSpin || game.years <= 0 || busy;
        }
        // Same condition as the asset buttons: their modals would open with everything disabled
        this.btnHouses.disabled = !currentPlayer.hasPressedSpin || game.years <= 0 || busy;
        this.btnCars.disabled = !currentPlayer.hasPressedSpin || game.years <= 0 || busy;
        this.btnAuction.disabled = !currentPlayer.hasPressedSpin || game.years <= 0 || busy;
        this.btnLottery.disabled = !currentPlayer.hasPressedSpin || game.years <= 0 || busy;

        this.btnSpin.classList.toggle("d-none", currentPlayer.hasPressedSpin || game.years <= 0);
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

        this.yearsLeftValue.textContent = String(game.years);
        // aria-label overrides the accessible name computed from content, so it needs the number
        // baked in too, not just the static hint (otherwise screen reader users would never hear it).
        this.btnYearsLeft.ariaLabel = t("play.yearsLeftLabel", {years: game.years});
        this.inputYearsLeft.classList.toggle("d-none", this._operation !== Operation.YearsLeft);
        this.btnConfirmYearsLeft.classList.toggle("d-none", this._operation !== Operation.YearsLeft);
        this.btnYearsLeft.disabled = busy;
        this.btnEndTurn.disabled = !currentPlayer.hasPressedSpin || busy;
        this.btnUndo.disabled = !persistence.canUndo() || busy;
        this.btnMenu.disabled = busy;

        this.btnWeddingLabel.textContent = t(!currentPlayer.married ? "play.wedding" : "play.anniversary");
        this.setOwnedStyle(this.btnWedding, currentPlayer.married);
        this.btnWedding.disabled = !currentPlayer.hasPressedSpin || busy;

        this.btnKids.disabled = !currentPlayer.married || !currentPlayer.hasPressedSpin || game.years <= 0 || busy;
        this.btnKidsLabel.textContent = !currentPlayer.married
            ? t("kids.title")
            : t(currentPlayer.kids === 1 ? "kids.countOne" : "kids.countOther", {count: currentPlayer.kids});

        this.btnChance.disabled = busy;

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
            this.btnYearsLeft.disabled = true;
        }

        persistence.save();
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
        // Try for a kid/Auction stash their outcome here (see pendingBreakdown) since it's already
        // known before the roll animation's suspense plays out; consumed once, right as the result
        // becomes visible.
        const breakdown = this.pendingBreakdown ?? undefined;
        const infoMessage = this.pendingInfoMessage;
        this.pendingBreakdown = null;
        this.pendingInfoMessage = null;
        if (infoMessage !== null)
            this.showInfoToast(infoMessage);
        this.render(undefined, breakdown);
    }

    /**
     * Current value if the player owns the asset (what selling would pay), otherwise its buy cost.
     */
    private getAssetPrice(player: Player, asset: Asset): number {
        const ownedAsset = player.getOwnedAsset(asset);
        return ownedAsset !== undefined ? Math.round(ownedAsset._value) : asset.buyCost;
    }

    /**
     * Marks an asset/wedding button as "owned" by switching its outline color (primary <->
     * success) instead of filling it solid green: a flat fill needs the text/icon recolored too
     * (readability) and, being a plain utility class of equal specificity to Bootstrap's own
     * .btn rule, loses to Bootstrap's own :disabled background the moment the button is disabled
     * (which it is at the start of every turn, before Spin). Swapping the outline variant instead
     * reuses Bootstrap's own color/contrast/disabled handling for that variant, so none of that
     * applies.
     */
    private setOwnedStyle(button: HTMLButtonElement, owned: boolean) {
        button.classList.toggle("btn-outline-primary", !owned);
        button.classList.toggle("btn-outline-success", owned);
    }

    private formatNumber(value: number): string {
        return value.toLocaleString(i18n.getLocale(), {useGrouping: true});
    }

    /**
     * Reveals the final ranking one row at a time, from last place up to the winner, instead of
     * the table appearing all at once: each row's Life Points count up from 0 over 4000ms
     * (reusing animateStatChange), and the winner's reveal triggers a confetti burst. New rows
     * are prepended, so the winner ends up on top once fully revealed, matching getRanking()'s
     * order. revealId is the token this call was started with (see scoreboardRevealId): every
     * step checks it's still current before touching the DOM, so a reveal that's fallen behind
     * (Undo taking the game back below game.years <= 0 mid-animation, or a brand new game
     * starting) quietly stops instead of writing into a scoreboard that's moved on.
     */
    private revealScoreboard(ranking: Player[], revealId: number) {
        const revealOrder = [...ranking].reverse();
        const revealNext = (index: number) => {
            if (revealId !== this.scoreboardRevealId || index >= revealOrder.length)
                return;
            const player = revealOrder[index];
            const rank = ranking.length - index;
            const isWinner = rank === 1;

            const row = document.createElement("tr");
            row.classList.add("scoreboard-row-enter");
            if (isWinner)
                row.classList.add("table-warning");
            let cell = row.insertCell();
            cell.textContent = String(rank);
            cell = row.insertCell();
            cell.textContent = player.name;
            const lifePointsCell = row.insertCell();
            lifePointsCell.textContent = `♥ ${this.formatNumber(0)}`;

            this.playerScoreboard.prepend(row);
            // Force a reflow so the transition below actually plays instead of the row just
            // appearing already in its final state.
            row.getBoundingClientRect();
            row.classList.remove("scoreboard-row-enter");

            if (isWinner) {
                confetti.burst();
                sounds.play("winTune");
            }

            this.animateStatChange(lifePointsCell, 0, player.lifePoints, (v) => `♥ ${this.formatNumber(v)}`, 4000, true, () => {
                if (revealId !== this.scoreboardRevealId)
                    return;
                setTimeout(() => revealNext(index + 1), 2000);
            });
        };
        revealNext(0);
    }

    /**
     * Counts the displayed text from "from" to "to" instead of jumping straight to the new
     * value, so an increase/decrease is felt, not just read. A no-op (sets the text directly,
     * then calling onComplete right away) when the value hasn't actually changed. Paused while a
     * modal is open (a houses/cars/kids/confirm/lottery/roll modal covers the sticky row, so the
     * count wouldn't be seen anyway), tracked via openModalCount (bumped by Bootstrap's own
     * show.bs.modal/hidden.bs.modal events) rather than a ".modal.show" DOM query, since that
     * class is only added once the backdrop's own fade-in has already finished: elapsed time
     * simply doesn't advance until every open modal closes, then the count resumes from where it
     * was.
     */
    private animateStatChange(element: HTMLElement, from: number, to: number, formatFn: (value: number) => string, duration: number = 2000, playEndSound: boolean = true, onComplete?: () => void) {
        if (from === to) {
            element.textContent = formatFn(to);
            onComplete?.();
            return;
        }
        // Floor between ticks: without it, a big delta changes the displayed value on nearly
        // every frame (60/s), which layered with playTone's 0.05s ring turns into a drone
        // instead of a tick. This caps it to a rhythm that still eases off naturally near the
        // end, since the displayed value stops changing every frame as the count-up slows down.
        const minTickInterval = 60;
        let elapsed = 0;
        let last = performance.now();
        let lastValue = Math.round(from);
        let lastTick = -Infinity;
        const step = (now: number) => {
            if (this.openModalCount === 0)
                elapsed += now - last;
            last = now;
            const t = Math.min(1, elapsed / duration);
            const value = Math.round(from + (to - from) * t);
            if (value !== lastValue) {
                lastValue = value;
                if (now - lastTick >= minTickInterval) {
                    sounds.play("beep");
                    lastTick = now;
                }
            }
            element.textContent = formatFn(value);
            if (t < 1)
                requestAnimationFrame(step);
            else {
                if (playEndSound)
                    sounds.play("fourBipEnd");
                onComplete?.();
            }
        };
        requestAnimationFrame(step);
    }

    /**
     * Chains animateStatChange through a list of category steps (see StatStep), each starting
     * where the previous one left off, with its own labelled delta toast (e.g. "+ € 5,000
     * (salary)") and its own duration (see getStepDuration()). A no-op step (amount 0, e.g. no
     * houses owned) never gets a pause before or after it: nothing visibly happened, so there's
     * nothing to breathe between.
     * @param spin true for Spin's multi-step breakdown: a fixed duration for "salary" (see
     * getStepDuration()), and no end-of-count sound from animateStatChange, since with several
     * categories chained back to back it would fire repeatedly, right into the next category's
     * tick sound. False for a single-step breakdown (Wedding, Kids, Auction) or a plain lump sum
     * (manual +/-, assets, salary, lottery), which only ever animate one step anyway (see
     * render()).
     * @param durationRange the [low, high] amount thresholds for getStepDuration().
     */
    private animateStatSteps(element: HTMLElement, from: number, steps: StatStep[], symbol: string, formatFn: (value: number) => string, spin: boolean, durationRange: [number, number], onComplete?: () => void) {
        if (steps.length === 0) {
            onComplete?.();
            return;
        }
        const [step, ...rest] = steps;
        const to = from + step.amount;
        if (step.amount !== 0) {
            const suffix = step.label !== "" ? ` (${t(STAT_STEP_LABEL_KEYS[step.label])})` : "";
            this.showDeltaToast(`${step.amount > 0 ? "+" : "−"} ${symbol} ${this.formatNumber(Math.abs(step.amount))}${suffix}`, step.amount > 0);
        }
        const duration = this.getStepDuration(step, spin, durationRange);
        this.animateStatChange(element, from, to, formatFn, duration, !spin, () => {
            const next = () => this.animateStatSteps(element, to, rest, symbol, formatFn, spin, durationRange, onComplete);
            if (step.amount !== 0 && rest.length > 0)
                setTimeout(next, 500);
            else
                next();
        });
    }

    /**
     * Count-up duration of one step. Spin's "salary" step keeps a fixed 2000ms (a single lump,
     * the original pace). Every other step, Spin's other categories included, scales with the
     * amount: 750ms at or below durationRange's low threshold, 2000ms at or above the high one,
     * logarithmic in between, so the duration grows with the number of digits (money thresholds
     * are two orders of magnitude apart: a linear scale would squash every common amount, e.g.
     * € 50,000-200,000, near the minimum).
     */
    private getStepDuration(step: StatStep, spin: boolean, [low, high]: [number, number]): number {
        if (spin && step.label === "salary")
            return 2000;
        const minDuration = 750, maxDuration = 2000;
        const amount = Math.abs(step.amount);
        if (amount <= low)
            return minDuration;
        if (amount >= high)
            return maxDuration;
        const t = Math.log(amount / low) / Math.log(high / low);
        return minDuration + (maxDuration - minDuration) * t;
    }

    /**
     * Delta toast for a value change (e.g. "+ € 50,000"), see getActiveToastContainer().
     */
    private showDeltaToast(message: string, positive: boolean) {
        this.showToast(message, positive ? "toast-positive" : "toast-negative");
    }

    /**
     * Toast for an outcome with no money/Life Points change to animate (e.g. Try for a kid
     * rolling no birth, an Auction bid that didn't yield anything), so it's not left silent.
     */
    private showInfoToast(message: string) {
        this.showToast(message, "toast-neutral");
    }

    /**
     * The sticky money/LP row sits at the top of the screen in portrait (toastContainerPortrait,
     * just below it) and in the middle in landscape (toastContainerLandscape, just above it, see
     * index.html) — 576px is Bootstrap's own "sm" breakpoint, the same one that switches the rest
     * of the layout between the two (see "Responsive behavior" in CLAUDE.md).
     */
    private getActiveToastContainer(): HTMLDivElement {
        return window.innerWidth >= 576 ? this.toastContainerLandscape : this.toastContainerPortrait;
    }

    private showToast(message: string, variantClass: string) {
        const toastElement = document.createElement("div");
        toastElement.classList.add("toast", "align-items-center", "border-0", variantClass);
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

        this.getActiveToastContainer().appendChild(toastElement);
        toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
        const toast = new bootstrap.Toast(toastElement, {delay: 5000});
        // Clickable to dismiss early (see the cursor: pointer on .toast-positive/-negative/-neutral
        // in main.scss): otherwise it sits there for the full 5s, which on mobile — where it can
        // cover a button underneath — reads as stuck rather than just delayed.
        toastElement.addEventListener("click", () => toast.hide());
        toast.show();
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
                this.showError(t("error.invalidInput"));
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
        if (exception instanceof GameError)
            this.showError(t(exception.key, exception.params));
        else
            this.showError(t("error.unexpected", {message: exception instanceof Error ? exception.message : String(exception)}));
        console.log(exception);
    }

    private showError(message: string) {
        this.playError.textContent = message;
        this.playError.classList.remove("d-none");
    }

    private clearError() {
        this.playError.classList.add("d-none");
    }
}

// Singleton: the module is executed only once, so this is the only instance.
export const playScreenUI = new PlayScreenUI();
