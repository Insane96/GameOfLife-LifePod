export class Mth {
    /**
     * Returns a random number between min (inclusive) anx max (exclusive)
     */
    public static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    public static randomDouble(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    public static clamp(value: number, min: number, max: number) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}