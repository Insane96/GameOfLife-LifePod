/**
 * Lightweight confetti burst for the end-of-game scoreboard reveal (see
 * PlayScreenUI.revealScoreboard), no external library: a handful of colored divs animated by
 * main.scss's confetti-fall keyframe, removed once their animation ends.
 */
class Confetti {
    // Mirrors the player accent palette ($player-accent-colors in main.scss) plus gold, so the
    // burst reads as part of the same game rather than a generic effect.
    private readonly colors = ["#d6423f", "#2f6fed", "#2e9e5b", "#e0b023", "#c23b9c", "#f2c94c"];

    burst(pieceCount: number = 80) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const container = document.createElement("div");
        container.className = "confetti-container";
        for (let i = 0; i < pieceCount; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.setProperty("--confetti-left", `${Math.random() * 100}%`);
            piece.style.setProperty("--confetti-duration", `${2 + Math.random() * 1.5}s`);
            piece.style.setProperty("--confetti-delay", `${Math.random() * 0.4}s`);
            piece.style.setProperty("--confetti-rotate", `${Math.random() * 360}deg`);
            piece.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            container.appendChild(piece);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 4000);
    }
}

export const confetti = new Confetti();
