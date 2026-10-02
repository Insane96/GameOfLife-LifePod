import soundsData from "./sounds.json" with {type: "json"};

/** One note of a sound in sounds.json. Times are in milliseconds */
interface Note {
    freq: number;
    dur: number;
    /** Silence after the note (and after each repetition), default 0 */
    gap?: number;
    /** How many times the note (with its gap) is played, default 1 */
    repeat?: number;
    /** Overrides the sound's type/gain for this note only */
    type?: OscillatorType;
    gain?: number;
}

interface SoundDefinition {
    /** Default "sine" */
    type?: OscillatorType;
    /** Default 0.15 */
    gain?: number;
    notes: Note[];
}

/** The keys of sounds.json: a typo in sounds.play("...") is a compile error */
export type SoundName = keyof typeof soundsData;

// The JSON's inferred types have type: string, not OscillatorType
const definitions = soundsData as Record<SoundName, SoundDefinition>;

class Sounds {
    // Created on first use: browsers only allow audio after a user gesture
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private volume = 0.4;

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

    private playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType, gainValue: number) {
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

    /**
     * Plays a sound from sounds.json, its notes one after the other.
     * Returns its length in seconds (gaps included), so the caller can wait for it to end.
     */
    play(name: SoundName): number {
        const ctx = this.getContext();
        const sound = definitions[name];
        const start = ctx.currentTime;
        let t = start;
        for (const note of sound.notes) {
            for (let i = 0; i < (note.repeat ?? 1); i++) {
                this.playTone(ctx, note.freq, t, note.dur / 1000, note.type ?? sound.type ?? "sine", note.gain ?? sound.gain ?? 0.15);
                t += (note.dur + (note.gap ?? 0)) / 1000;
            }
        }
        return t - start;
    }
}

export const sounds = new Sounds();
