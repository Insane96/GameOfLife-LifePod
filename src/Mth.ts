export class Mth {
    /**
     * Returns a random integer between min and max (both inclusive)
     */
    public static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Returns a random number between min (inclusive) anx max (exclusive)
     */
    public static randomDouble(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Returns a random number between min and max, more likely to fall near mode
     * (triangular distribution). Defaults mode to (min + max) / 2.
     */
    public static triangle(min: number, max: number, mode: number = (min + max) / 2) {
        const randomSample = Math.random();
        const modeFraction = (mode - min) / (max - min);

        if (randomSample < modeFraction) {
            return min + Math.sqrt(randomSample * (max - min) * (mode - min));
        }
        return max - Math.sqrt((1 - randomSample) * (max - min) * (max - mode));
    }

    /**
     * Returns an integer between min and max (both inclusive), more likely to fall near
     * mode. The range is extended by 0.5 on each side before rounding so that min and max
     * get a full-width bin like every other integer, instead of being cut in half by the
     * rounding boundary. Defaults mode to (min + max) / 2.
     */
    public static triangleInt(min: number, max: number, mode: number = (min + max) / 2) {
        return Math.round(Mth.triangle(min - 0.5, max + 0.5, mode));
    }

    /**
     * Clamps value between min and max
     */
    public static clamp(value: number, min: number, max: number) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}