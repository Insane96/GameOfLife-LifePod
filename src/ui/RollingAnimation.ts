import {sounds} from "./Sounds.js";
import {Mth} from "../Mth.js";

/**
 * Uses the #roll-modal
 */
export class RollingAnimation {
    private currentSpin: number = 0;
    private currentElement: number;
    private usedElements: HTMLDivElement[] = [];

    private slowdown: boolean = false;

    /**
     * minNumber and maxNumber inclusive
     */
    constructor(private minNumber: number, private maxNumber: number, private spins: number, private rolledNumber: number, private onEnd: () => void) {
        if (this.minNumber < 0 || this.maxNumber > 12 || this.maxNumber <= this.minNumber)
            throw new Error("Invalid min and/or max for RollingAnimation");
        this.currentElement = 0;
        // Used numbers are spread evenly on the circle (see .roll-number in main.scss)
        const count = this.maxNumber - this.minNumber + 1;
        for (let i = 0; i <= 12; i++) {
            let rollNumber = document.getElementById(`roll-number-${i}`) as HTMLDivElement;
            rollNumber.classList.remove("roll-result-blink");
            if (i >= this.minNumber && i <= this.maxNumber) {
                this.usedElements.push(rollNumber);
                rollNumber.classList.remove("d-none");
                rollNumber.style.setProperty("--roll-index", String(i - this.minNumber));
                rollNumber.style.setProperty("--roll-count", String(count));
            }
            else {
                rollNumber.classList.add("d-none");
            }
        }
        setTimeout(() => this.spin(), 1000);
        this.render();
    }

    private spin() {
        let timeout = 100;
        this.currentElement++;
        if (this.currentElement >= this.usedElements.length) {
            this.currentElement = 0;
            this.currentSpin++;
        }
        if (this.currentSpin >= this.spins - 1 && !this.slowdown && (Mth.randomInt(0, 8) == 0 || this.currentSpin >= this.spins)) {
            this.slowdown = true;
        }
        if (this.slowdown)
            timeout = 250;
        const currentNumber = parseInt(this.usedElements[this.currentElement].id.split("-")[2]);
        if (this.rolledNumber == currentNumber && this.currentSpin >= this.spins) {
            sounds.successTune();
            this.usedElements[this.currentElement].classList.add("roll-result-blink");
            this.onEnd();
        }
        else {
            sounds.goodBeep();
            setTimeout(() => this.spin(), timeout);
        }

        this.render();
    }

    public render() {
        for (let i = 0; i < this.usedElements.length; i++){
            const usedElement = this.usedElements[i];
            usedElement.classList.remove("green");
            if (this.currentElement === i)
                usedElement.classList.add("green");
        }
    }
}