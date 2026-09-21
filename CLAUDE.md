# Digital Lifepod

## What it is

A digital replacement for the electronic Lifepod device only, from the board
game "The Game of Life: Twists & Turns". **It does not replace the whole game**:
board, cards, pawns and rulebook stay physical. The app replaces only the
device players used to track salary, Life Points, family, house, car, and to
generate the spin result in place of the wheel.

Reference on the original device, for context: you inserted your personal Visa
card at the start of your turn, the device generated the spin result,
calculated salary and Life Points, tracked family/house/car, and had dedicated
buttons for the various game events (see the original "Lifepod reference
cards").

## Stack

- Vanilla JS/TS + Bootstrap. No framework (React/Vue/etc.).
- Persistence: localStorage (see the dedicated section, it is a critical
  requirement).

## Interface decisions made

- **Orientation**: landscape first, but it must stay usable in portrait.
  Native Bootstrap only (grid, responsive breakpoints and utility classes): no
  custom CSS or media queries for portrait/landscape.
- **Players**: up to 6 (the original hardware supported 4 through the colored
  Visa cards: red, blue, green, yellow). In the digital version we extend the
  palette with magenta and black for the two extra players (see `PlayerColor`
  in the backend). Every player is always identified by color + initial/name,
  never by color alone (accessibility).
- **Turn change**: an explicit handover screen ("End turn" → "Who plays
  now?"), not an always-visible switcher that can be tapped at any moment. It
  replicates the ritual of inserting/removing the physical card and prevents
  actions taken on the wrong turn.
- **Landscape layout**: left sidebar with a vertical list of players +
  financial summary of the active player (balance, Life Points, family). Main
  area on the right with the Spin button (primary action, large, circular,
  always reachable) and event categories (Career / Family / Home and car /
  Events) with a grid of icon + label buttons.
- **Portrait layout**: vertical stack (player bar on top, summary, spin,
  categories, actions), same information hierarchy as the landscape layout.
- **Value change feedback**: toasts (e.g. "+50,000 €", "+2 Life Points")
  instead of a silent number update only.
- **Undo**: an "Undo last action" button always visible next to "End turn".
  More important than in the original because the device changes hands more
  often.
- **Game creation**: players are entered first (name + color), then "New
  game" is pressed, which calls the backend (`game.init` with the number of
  years) and starts the game.
  - From 2 to 6 players (start with 2 rows; "Add player" / "X" to add and
    remove, never below 2).
  - Name: if left empty the placeholder is used ("Player N"); a name made of
    spaces only is invalid. Duplicate names are not allowed.
  - Color: mandatory and unique. Selector made of radio buttons styled as
    circles; colors already chosen by other players are disabled.
  - Years: integer between 1 and 99, default 15 (empty field → default).
  - Validation errors appear in the card (see "Error messages" in the code
    conventions), not in `alert` dialogs.
  - All validations happen before touching `game`, so we never end up with a
    half-initialized game.
- **Lottery**: a separate panel, apart from the main event categories
  (Career / Family / Home and car / Events).
- **Game screen (partially implemented)**: Bootstrap grid with 3 rows
  (`container-fluid`, `min-vh-100`, `d-flex flex-column`, rows with
  `flex-grow-1`), with the content of each cell anchored to its position
  (top-left, top-center, top-right, etc.).
  - Top: lottery/salary/initiative, houses and cars, board spaces (cells still
    empty).
  - Middle: name of the player whose turn it is, money and life points, each
    with `+` / `−` buttons that open a numeric field (`inputmode="numeric"`)
    with a ✓ confirm button. Only one field open at a time, managed by
    `PlayScreenUI._operation` (`Operation` enum).
  - Bottom: volume (empty), "Spin" in the center, years left and "End turn" on
    the right.
  - **Turn flow**: the button is called "Spin" as on the original Lifepod (it
    is the same primary Spin button described in the layouts above, not a
    separate "Go!" button). Pressing it (`Player.onSpin()`) credits salary and
    bonuses and unlocks "End turn"; "End turn" (`game.endTurn()`) throws an
    error if Spin was not pressed. Spin can be pressed once per turn. When the
    turn changes, the open operation is closed and the fields are cleared.
    The code uses the same naming (`btn-spin`, `btnSpin`, `hasPressedSpin`,
    `Player.onSpin()`). The roll result (`game.rolledNumber`) is shown for now
    with a placeholder `alert("Rolled N")`; a proper display is still to be
    designed.
  - **End of game**: at `game.years <= 0`, `endGame` sells the assets and
    converts money into Life Points. `render()` hides the player name, money
    and Life Points, shows a scoreboard table (Rank / Player / Life Points,
    built from `game.getRanking()`; the first row, the winner, is highlighted
    with `table-warning`) and disables/hides Spin and the +/− buttons. There is
    no `game.winner`: the winner is the first entry of the ranking. Ties keep
    the turn order (the sort is stable).
  - The bottom-left cell (`cell-settings`) is reserved for settings (volume,
    fullscreen).
- **Fullscreen button**: a single `btn-fullscreen` element, handled by
  `GlobalUI`, shared by all screens. `GlobalUI.render()` moves it (with
  `appendChild`, which moves the node instead of copying it) into the start
  screen or into `cell-settings`, depending on `game.gameStarted`. Its
  `aria-label` is updated from the `fullscreenchange` event, not from the
  click, because the user can also leave fullscreen with Esc or a system
  gesture. It is hidden when `requestFullscreen` is not available (iPhone
  Safari does not support it on regular pages; the PWA is the way to get
  fullscreen there, see "Open").

## Persistence (localStorage) — critical requirement

If the page is reloaded by mistake, the game must not be lost.

- Write the entire game state on every single action (spin, applied event,
  turn change). Small, instant writes, no debounce needed.
- At startup, if a saved state exists: always explicitly ask "Resume game" vs
  "New game". Never resume or delete automatically without asking.
- An explicit "New game" action is needed somewhere in the interface (settings
  or a screen corner) to deliberately wipe the storage at the end of a game.

## Deploy (GitHub Pages)

- The site is static and is published to GitHub Pages by the workflow
  `.github/workflows/deploy.yml`, on every push to `master` (or manually from
  Actions). In *Settings → Pages* the source must be "GitHub Actions".
- The workflow runs `npm ci` and `npm run build`, then assembles `_site/` with
  only `index.html`, `dist/` and `bootstrap.bundle.min.js`. The latter is
  copied to `node_modules/bootstrap/dist/js/` (same path as in the HTML) so
  `index.html` works the same locally and online. If Bootstrap is moved,
  update the HTML and the workflow together.
- `dist/` and `node_modules/` stay in `.gitignore`: they must not be
  committed.
- Paths in `index.html` must stay **relative** (the site lives under
  `/GameOfLife-LifePod/`, not at the domain root).
- `localStorage` is shared per origin (`insane96.github.io`), so all keys use a
  prefix (`lifepod.`), to avoid colliding with other projects published from
  the same account.

## Note on Bootstrap

The default look is too generic for the agreed modern/minimal goal. Override
Bootstrap's CSS variables (`--bs-border-radius`, `--bs-body-font-family`, color
palette) instead of using the defaults as-is.

## Code conventions

- **HTML vs TS**: the static structure (containers, screens, fixed buttons) is
  written by hand in `index.html`; TS generates/clones only what is dynamic
  (e.g. player rows). No inline `onclick`: events are attached from TS with
  `addEventListener`.
- **Ids and classes**: kebab-case. `btn-` prefix for buttons and
  `input-`/`txt-` for input fields; no prefix for containers and screens
  (`start-screen`, `players-list`).
- **Component UI**: one class per component (e.g. `DOMPlayer`), which receives
  callbacks from the container instead of importing it (no circular imports).
  State that depends on several elements (e.g. disabled colors) is recomputed
  from scratch in a single function, not with incremental updates.
- **Rendering**: a single `render()` function per screen re-reads the state
  and rewrites the whole DOM (texts, enabled/disabled buttons, elements hidden
  with `classList.toggle("d-none", condition)`). Every handler does: action on
  the model, then `render()`. Handlers wrap calls to the model in `try/catch`
  (the setters throw when out of range).
- **Error messages**: in the main menu, errors are shown inside the card in a
  single Bootstrap alert (`#menu-error`, `alert alert-danger`, `role="alert"`,
  hidden with `d-none`) through `showError(message)` / `clearError()` in
  `MainMenuUI`; the message is cleared at the start of the next user action.
  The rule about the number of players lives in `MainMenuUI` (`DOMPlayer` only
  asks it through a callback). The game screen still uses `alert` for now (a
  placeholder, to be replaced when it is redesigned). Per-field messages
  (`is-invalid` + `invalid-feedback`) are a possible later improvement.
- **Callbacks to model methods**: pass arrow functions
  (`(v) => game.getCurrentPlayerTurn().addMoney(v)`), never the bare method
  (`player.addMoney`, it loses `this`). The arrow resolves the current player
  at call time.
- **User text in the DOM**: always `textContent`, never `innerHTML` (names are
  typed by the user).
- **Accessibility**: buttons with only a symbol (`+`, `−`, `✓`, `X`) and
  inputs without a visible `<label>` have an `aria-label` in the UI language.
- **Numeric inputs**: `type="text" inputmode="numeric" pattern="[0-9]*"`;
  `parseInt` + `Number.isNaN` before calling the model. The backend rejects
  `NaN` and out-of-range values anyway.
- **Screens as singletons**: `MainMenuUI`, `PlayScreenUI` and `GlobalUI` are
  **non-exported** classes with instance fields and methods (`this.` is used); listeners are
  attached in the constructor. The module exports the single instance
  (`export const playScreenUI = new PlayScreenUI();`), which other files import
  by name. An ES module is executed only once, so `getInstance()` is not
  needed. When an instance method is passed as a callback (e.g. to `DOMPlayer`)
  it must be wrapped in an arrow function (`() => this.updateColorGrid()`),
  otherwise it loses `this`.
- **Export**: named only (`export class X`, `export const x`), no
  `export default`.
- **Game as a singleton**: `Game` is a **non-exported** class with instance
  members; the module exports the only instance (`export const game = new
  Game();`), used everywhere as `game.years`, `game.endTurn()`, etc. Same
  pattern as the UI screens. `Player` and `Game` import each other, which is
  fine as long as neither uses the other at module load time (only inside
  methods). Lowercase `game` is the instance, never `Game.`.
- **Models vs UI**: the backend (`Game`, `Player`, ...) never knows the DOM.
- **Language**: this file, code comments (also in SCSS, scripts and workflows)
  and identifiers are in English. Conversation with the user is in Italian.
- **Native ES modules, no bundler**: relative imports need the `.js` extension
  (`import {X} from "./X.js"`); `package.json` has `"type": "module"` and
  `tsconfig` uses `NodeNext`.
- **Development**: `npm run dev` builds, starts the watchers (`tsc` and
  `sass`), a static server on `localhost:5500`, and opens the browser.

## Collaboration mode

- Do not write code (changes to existing files or new files) unless expressly
  requested. If a possible fix comes up during a review or a discussion,
  propose it and wait for explicit confirmation before implementing it — it is
  not enough for the user to say "maybe I'll do X" to interpret it as an
  implementation request. Writing tooling, on the other hand, is allowed.

## Open / to be decided

- Undo: limited to the last action or a stack of several actions within the
  turn?
- localStorage persistence: not implemented yet (the "Continue game" button is
  a placeholder). `game` (the singleton) has no reset for a new game;
  `Asset`s contain functions, so they must be saved by name and rebuilt, not
  serialized. `game.gameStarted` also has no reset.
- Translations: postponed. When needed: IT + EN, a hand-made `t(key)` helper
  with TS dictionaries (the English type constrained to the Italian keys), no
  external library.
- PWA (future): the Lifepod will be used on a phone at the game table. With a
  Service Worker and a `manifest.json` it could work offline and be installed
  as an app, and it would also give fullscreen on iPhone (via the manifest
  `display` setting), where the Fullscreen API is not available.
- Visual direction ("it must not look like a business app"): ideas, in
  increasing cost. The game screen redesign (points 2-4) waits until the game
  screen works functionally; the theme (point 1) also applies to the main menu.
  1. Theme, only Sass variables: a game-like saturated palette (from the
     player colors and the Game of Life look) with a colored dark background
     instead of neutral gray; a font with character for title and numbers
     (e.g. from Fontsource or Google Fonts) instead of `system-ui`; very
     rounded corners and pill buttons (`$border-radius`, `$btn-border-radius`).
  2. Numbers and buttons at the center of attention (game screen): money and
     Life Points very large, like on the original Lifepod display, with a small
     label below (today they are plain text next to `+`/`−`); Spin as a big
     circular button with a shadow and a "press" effect (it is already the
     primary action in the specs); icons (Bootstrap Icons or emoji) instead of
     `+`, `−`, `↔` and small captions.
  3. Player identity: tint the screen with the color of the player whose turn it
     is (bar, borders, Spin button). It helps when the phone is handed over,
     because whose turn it is can be recognized at a glance, and it makes the
     "Visa card" of the original device concrete.
  4. Life and feedback: a short number animation for the roll instead of an
     `alert`, the delta toasts already planned ("+50,000 €") and maybe confetti
     at the end of the game. This is what makes it look like a game instead of
     a form.
  5. Remove "business" signals: fewer `btn-sm` and `btn-outline-*`, no gray
     uppercase labels, few borders.
- Optional rules (house rules) in the backend (`HouseRules`: unlimited kids,
  balanced rolling, lottery jackpot bonus with no winner): decision postponed
  (low priority), to be settled where they are enabled in the interface and
  whether they can be changed mid-game.
- End of game: `game.endGame` sells the assets and converts money into
  rounded Life Points through `conversionRatio`; `game.getRanking()` returns a
  sorted copy of the players. The scoreboard is a plain table inside the game
  screen; a dedicated end-of-game screen (new game, back to the menu) is still
  missing, and so is a rule for ties (same rank or not).
- Delta toasts ("+50,000 €") not implemented yet: planned as a before/after
  comparison of values (snapshot) in `PlayScreenUI`, without events in the
  model.
- Cells of the game screen still empty (lottery, houses and cars, board
  spaces, volume) and `Player` has no getters for `assets`/`qualification`
  (`marry` should be renamed `married`).
