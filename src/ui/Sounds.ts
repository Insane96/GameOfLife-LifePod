class Sounds {
    // Created on first use: browsers only allow audio after a user gesture
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private volume = 1;

    constructor() {
        // The first click anywhere (New game, Resume game...) creates and unlocks the context
        document.addEventListener("click", () => this.getContext(), {once: true});
    }

    /** Master volume, from 0 (muted) to 1 */
    setVolume(value: number) {
        this.volume = Math.min(1, Math.max(0, value));
        if (this.master !== null)
            this.master.gain.value = this.volume;
    }

    private getContext(): AudioContext {
        if (this.ctx === null) {
            this.ctx = new AudioContext();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.volume;
            this.master.connect(this.ctx.destination);
        }
        // Idempotent: unlocks the context if it started suspended
        void this.ctx.resume();
        return this.ctx;
    }

    private playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = "sine", gainValue = 0.15) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.005);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(gain).connect(this.master!);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    /** Single “good beep” for button press / money entry */
    goodBeep() {
        const ctx = this.getContext();
        this.playTone(ctx, 1000, ctx.currentTime, 0.1);
    }

    spinBeep() {
        const ctx = this.getContext();
        this.playTone(ctx, 1000, ctx.currentTime, 0.075, "square");
    }

    spinEnd() {
        const ctx = this.getContext();
        const noteLength = 0.12;
        const gap = 0.0;
        const now = ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            this.playTone(ctx, 800, now + i * (noteLength + gap), noteLength, "square");
        }
    }

    /** Short success “tune” (C–E–G–C) */
    successTune() {
        const ctx = this.getContext();
        const noteLen = 0.12;
        const gap = 0.02;

        // Simple major arpeggio: C5, E5, G5, C6
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        let t = ctx.currentTime;
        for (const f of freqs) {
            this.playTone(ctx, f, t, noteLen, "sine", 0.12);
            t += noteLen + gap;
        }
    }

    /** Error “bad beep”: two quick beeps */
    badBeep() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const noteLen = 0.09;
        const gap = 0.04;

        this.playTone(ctx, 700, now, noteLen, "square", 0.1);
        this.playTone(ctx, 550, now + noteLen + gap, noteLen, "square", 0.1);
    }
}

export const sounds = new Sounds();
