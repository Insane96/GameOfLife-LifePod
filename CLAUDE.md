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
  Money, Life Points and Spin stay fixed at the top (sticky) while the rest
  scrolls; details in "Game screen" → "Responsive behavior".
- **Value change feedback**: toasts (e.g. "+ € 50,000", "+ ♥ 2") instead of a
  silent number update only, implemented so far for money and Life Points.
  `PlayScreenUI.render()` keeps a snapshot (`statsPlayer`/`lastMoney`/
  `lastLifePoints`) of what was last shown for the current player; when the
  model value differs from the snapshot for the *same* player (a turn change
  is not a "change"), it counts the displayed number from the old to the new
  value (`animateStatChange`, linear count-up; duration from
  `getStepDuration`: fixed 2000ms for Spin's "salary" step, otherwise
  750–2000ms on a log scale of the amount, thresholds € 10,000–1,000,000 and
  ♥ 200–2,000) and shows a delta toast
  (`showDeltaToast`, a dynamically created Bootstrap `.toast` appended to
  `#toast-container`, colored via `.toast-positive`/`.toast-negative`). No
  events in the model: the comparison happens entirely in the UI layer. Other
  values (the roll, asset prices, ...) are not animated yet.
- **Undo**: an "Undo last action" button (`btn-undo`), always visible next to
  the "Menu" button in `cell-settings` (not next to "End turn": grouped with
  the other screen-level controls instead of the turn-specific ones). More
  important than in the original because the device changes hands more often.
  Single level (undoes only the last action, no stack): see "Persistence".
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
  - Top: lottery/salary/initiative, "Houses" and "Cars" buttons, board spaces
    (cells still empty). Each of the two buttons opens a modal
    (`houses-modal`, `cars-modal`, see "Modals" below) with the buy/sell button
    of each asset. Buying happens with a single click, with no confirmation;
    selling opens the shared `confirm-modal` (see "Modals" below). `btn-houses`
    and `btn-cars` are disabled with the same condition as the asset buttons
    (Spin not pressed, or game over).
  - Middle: name of the player whose turn it is, money and life points, each
    with `+` / `−` buttons that open a numeric field (`inputmode="numeric"`)
    with a ✓ confirm button, then the roll/chance results and the "Spin"
    button right below. Only one field open at a time, managed by
    `PlayScreenUI._operation` (`Operation` enum). Spin lives in this row, not
    in the bottom one, so it is always visible next to the numbers (see
    "Responsive behavior" below).
  - Bottom: settings on the left (`cell-settings`), in the center the
    "Wedding" and "Kids" buttons (Degree/PhD still to be added), years left and
    "End turn" on the right. "Kids" is enabled only if the player is married and
    opens `kids-modal` with three buttons: 1 kid (`addKids(1)`), 2 kids
    (`addKids(2)`), and "Try for a kid" (`tryForAKid()`, which rolls the
    chance).
  - **Turn flow**: the button is called "Spin" as on the original Lifepod (it
    is the same primary Spin button described in the layouts above, not a
    separate "Go!" button). Pressing it (`Player.onSpin()`) credits salary and
    bonuses and unlocks "End turn"; "End turn" (`game.endTurn()`) throws an
    error if Spin was not pressed. Spin can be pressed once per turn: it
    disappears after being pressed (`d-none` toggled from
    `currentPlayer.hasPressedSpin` in `render()`) and comes back when the turn
    changes. When the turn changes, the open operation is closed and the fields
    are cleared.
    The code uses the same naming (`btn-spin`, `btnSpin`, `hasPressedSpin`,
    `Player.onSpin()`). The roll result (`game.rolledNumber`) is shown as text
    ("Rolled: N") in `#player-roll`, and the chance result in `#chance-result`,
    both in the middle row under money and Life Points; a proper display
    (animation) is still to be designed.
  - **End of game**: at `game.years <= 0`, `endGame` sells the assets and
    converts money into Life Points. `render()` hides the player name, money
    and Life Points, shows a scoreboard table (Rank / Player / Life Points,
    built from `game.getRanking()`; the first row, the winner, is highlighted
    with `table-warning`) and disables/hides Spin and the +/− buttons. There is
    no `game.winner`: the winner is the first entry of the ranking. Ties keep
    the turn order (the sort is stable).
  - The bottom-left cell (`cell-settings`) is reserved for settings: volume,
    fullscreen (both moved in by `GlobalUI`, see below), plus the static
    `btn-menu` ("Back to menu", does not touch the saved game) and `btn-undo`
    ("Undo last action") buttons, both wired by `PlayScreenUI`.
  - **Responsive behavior** (Bootstrap classes only, breakpoint `sm` = 576px:
    below it the layout is "portrait", from `sm` up it is "landscape"; it is
    based on width, not on the real orientation):
    - The three rows of `#play-screen` are flex items in a column. The middle
      row has `order-first order-sm-0` to go on top in portrait, and
      `sticky-top bg-body` so it stays fixed while the rest scrolls. It also has
      `flex-grow-0 flex-sm-grow-1` so it does not stretch in portrait.
    - The cells of the top and bottom rows use `col-sm-*` (3 / 6 / 3) without a
      base `col-*`: below `sm` a child of `.row` is 100% wide, so they stack by
      themselves. Use `p-*` inside the cells, never `m-*`, otherwise margins add
      to the percentage widths and the last cell wraps.
    - Bottom row in portrait: the Wedding cell is `col-12 order-first`, then
      `cell-settings` and `cell-years-end-turn` are `col-6` and share a line
      (fullscreen bottom-left, End turn bottom-right).
    - The top-left cell (Salary, Chance, Business / Auction) centers its
      buttons in portrait (`align-items-center`) and keeps them left-aligned
      from `sm` up (`align-items-sm-stretch`).
    - The "Houses" / "Cars" buttons are stacked (`flex-column`) in portrait and
      side by side (`flex-sm-row flex-sm-wrap`) from `sm` up, at their natural
      width in portrait (`align-items-center`, same as Salary/Chance/Auction
      above) instead of stretching full-width (flexbox's `stretch` default).
    - **Modals** (`kids-modal`, `houses-modal`, `cars-modal`, `confirm-modal`):
      native Bootstrap modals, written by hand in `index.html` outside
      `#play-screen`, with `modal fade` + `tabindex="-1"` + `aria-label`, and
      the three nested levels
      `.modal-dialog.modal-dialog-centered` > `.modal-content` > `.modal-body`
      (never on the same element). They are opened with `data-bs-toggle="modal"`
      and `data-bs-target` on the opener button, and closed by clicking outside,
      Esc, or `data-bs-dismiss="modal"` on the buttons inside; the click
      listeners of those buttons are still attached from `PlayScreenUI`. Inside,
      the buttons are stacked in portrait and in a row from `sm` up
      (`d-flex flex-column flex-sm-row justify-content-center gap-2`, buttons
      with `flex-sm-fill`). Do not use `modal-sm` when the buttons are in a row:
      300px are not enough.
      `confirm-modal` replaces the native `confirm()` for actions that need a
      yes/no check (Wedding/Anniversary, selling an asset, overwriting a saved
      game from the main menu): it has no `data-bs-target` opener of its own,
      because the message and the action to run on confirm change every time.
      Wrapped by the shared `ConfirmModal` singleton (`ui/ConfirmModal.ts`,
      same non-exported-class/exported-instance pattern as the other screens)
      instead of belonging to a single screen, since both `PlayScreenUI` and
      `MainMenuUI` need it. `confirmModal.confirm(message, onConfirm)` sets
      `#confirm-message`, stores `onConfirm` in `confirmCallback`, and opens
      the modal; the single `btn-confirm-ok` listener (attached once, in its
      constructor) runs `confirmCallback` and clears it. `btn-confirm-cancel`
      and outside/Esc close the modal with no callback (`data-bs-dismiss=
      "modal"`, nothing else attached).
    - The warm glow in `main.scss` is a `background-attachment: fixed` gradient
      on `body`; `.sticky-top` repeats it so that the opaque `bg-body` of the
      sticky row does not cut the glow.
    - **Player identity tint**: `PlayScreenUI.render()` sets
      `data-player-color` on `#play-screen` to the current player's
      `PlayerColor` name (removed at `game.years <= 0`); `main.scss` maps it to
      a `--player-accent` custom property (falls back to `--bs-primary`), used
      by `#player-name`, the sticky row's bottom border and the Spin ring
      (`.btn-spin`'s `box-shadow`, not its fill, to keep the button's own
      contrast regardless of player color). This is the "Visa card" cue from
      the original device: whose turn it is is visible at a glance when the
      phone changes hands.
    - **Icons**: Bootstrap Icons (`bi bi-*`), loaded from the jsdelivr CDN in
      `index.html` next to the Google Fonts link (not self-hosted, no build
      step needed). Decorative icons next to a visible text label get
      `aria-hidden="true"`; icon-only buttons (`+`/`−`/`✓`/remove
      player/fullscreen) keep their existing `aria-label` and use the
      `.btn-icon` class (fixed 2.5rem circle, centered icon).
- **Fullscreen button and volume control**: a single `btn-fullscreen` element
  and a single `volume-control` element (icon + `input-volume`), both handled
  by `GlobalUI`, shared by all screens. `GlobalUI.render()` moves both (with
  `appendChild`, which moves the node instead of copying it) into the start
  screen (`start-screen-settings`) or into `cell-settings`, depending on
  whether `#play-screen` is currently visible (not `game.gameStarted`: "Back
  to menu", see `btn-menu` above, shows the start screen again without
  resetting the game, so the two can diverge). `btn-fullscreen`'s `aria-label`
  is updated from the
  `fullscreenchange` event, not from the click, because the user can also
  leave fullscreen with Esc or a system gesture. It is hidden when
  `requestFullscreen` is not available (iPhone Safari does not support it on
  regular pages; the PWA is the way to get fullscreen there, see "Open").

## Persistence (localStorage) — critical requirement

If the page is reloaded by mistake, the game must not be lost. Implemented in
`src/Persistence.ts` (`Persistence`, non-exported class + exported `persistence`
instance, same singleton pattern as the other models), used by `MainMenuUI`
and by `PlayScreenUI`/`LotteryUI`.

- Every model (`Game`, `Player`, `OwnedAsset`, `Lottery`) serializes itself
  (`toJSON()`/`loadFromJSON()` or `static fromJSON()`), never `Persistence` or
  the UI: keeps "Models vs UI" (backend never knows the DOM) and keeps the
  shape next to the fields it mirrors. `Asset` can't be serialized directly
  (its `onNewTurnExtra` is a function): each static Asset has an `id` string
  and `Asset.byId(id)` reconstructs the singleton reference. `Lottery`'s
  `numbersPerPlayer`/`confirmedPlayers` are keyed by `Player` object identity,
  so they save as indices into `game.players` and resolve back to references
  on load, against the array `Game.loadFromJSON` already rebuilt.
- `persistence.save()` writes the whole state (`{version, game, lottery}` JSON
  under the `lifepod.save` key) every time it's called, but only if it
  actually differs from the last write: called from the tail of
  `PlayScreenUI.render()` and `LotteryUI.render()` (every handler already
  ends in one of those, see "Rendering" in Code conventions) rather than from
  every individual handler, so a UI-only re-render (opening an input, say)
  never touches storage. `LotteryUI.onSpin()` also calls it explicitly right
  after `lottery.roll()`, since the payout needs to survive a reload during
  the several-second animated reveal that follows, before the next `render()`.
- Undo: whatever `lifepod.save` held right before a real (content-changing)
  write is kept as `lifepod.save.previous`; `persistence.undo()` promotes it
  back and removes it, single level (not a stack, not repeatable until a new
  action creates a fresh undo point). `btn-undo`, see "Undo" under Interface
  decisions.
- At startup (`MainMenuUI`'s constructor), `persistence.hasSavedGame()`
  decides whether "Continue game" (`btn-continue`) is enabled; clicking it
  calls `persistence.load()`. Never resumed or deleted automatically.
- No dedicated "wipe" action: `btn-menu` ("Back to menu", see Interface
  decisions) returns to the start screen without touching the save, so from
  there the player picks "Continue" or starts fresh. Starting fresh
  (`btn-start`) while a save exists asks for confirmation first (shared
  `confirmModal`, see "Modals"); only once confirmed does `MainMenuUI` call
  `game.reset()`/`lottery.reset()`/`persistence.wipe()` before adding the new
  players and calling `game.init()`. `wipe()` (not just letting the next
  `save()` overwrite it) matters: otherwise the abandoned game would end up
  as the fresh game's `lifepod.save.previous`, and Undo would resurrect it.

## Translations (i18n)

Italian and English, with a hand-made helper and TS dictionaries in
`src/i18n/`, no external library.

- `en.ts` is the reference dictionary (`TranslationKey = keyof typeof en`);
  `it.ts` is a `Partial<Record<TranslationKey, string>>`: a key that doesn't
  exist in English is a compile error, a missing Italian key falls back to the
  English text. Keys are dotted and grouped by screen/area (`menu.*`,
  `play.*`, `error.*`, `confirm.*`, `step.*`, ...).
- `I18n.ts`: `i18n` singleton (same pattern as the other modules) plus the
  `t(key, params?)` shorthand. Placeholders are written `{name}` in the text
  and filled from `params`. `i18n.getLocale()` (`"it-IT"`/`"en-US"`) is what
  every `toLocaleString` uses, never a hard-coded locale. Plurals: two keys
  (`kids.countOne`/`kids.countOther`) chosen with `count === 1`, enough for
  IT/EN.
- The chosen language is a preference, not part of the game: saved under
  `lifepod.lang`, separate from `lifepod.save` (Undo never touches it);
  defaults to `navigator.language` (any `it-*` → Italian, else English).
  `setLanguage()` also updates `<html lang>`.
- The language selector (`input-language`) lives only in the main menu
  (`start-screen-settings`, not moved by `GlobalUI` like volume/fullscreen),
  wired by `GlobalUI`. On a change, `i18n` calls the listeners registered with
  `addLanguageChangeListener`: `GlobalUI` (static texts, fullscreen label),
  `MainMenuUI` (clears the error, re-translates the player rows via
  `DOMPlayer.translate()`), `HouseRulesUI`. `PlayScreenUI`/`LotteryUI` don't
  register: they aren't visible while the language can change and re-render
  when shown (an out-of-turn `PlayScreenUI.render()` could also start the
  value animations).
- **Static texts** in `index.html` carry their key in `data-i18n`
  (`textContent`), `data-i18n-aria-label` or `data-i18n-placeholder`, applied
  by `GlobalUI.render()` over the whole document (cloned elements like the
  color picker included). Text next to an icon is wrapped in a
  `<span data-i18n>` so setting `textContent` doesn't wipe the icon. The
  English text stays in the HTML as the fallback; an unknown key keeps it and
  logs a console warning. Texts that a `render()` rewrites (e.g.
  `btn-wedding-label`) or that need params (player number) get no `data-i18n`:
  they are translated in TS.
- **Models hold no display text**, only identifiers the UI translates (same
  idea as "Models vs UI"):
  - errors the player can run into are thrown as `GameError(key, params)`
    (`src/GameError.ts`, only a type import of `TranslationKey`) and
    translated by `PlayScreenUI.onError`; errors only a bug can trigger (the
    UI already prevents them) stay plain English `Error`s, shown as
    "Error: {message}";
  - `StatStep.label` (`StatStepLabel`) and `HouseRule.id` (`HouseRuleId`) are
    string unions mapped to keys by a `Record` in the UI
    (`STAT_STEP_LABEL_KEYS` in `PlayScreenUI`, `HOUSE_RULE_KEYS` in
    `HouseRulesUI`), so adding one without a translation is a compile error.
- Player names are user text: never translated. A name left empty takes the
  (translated) placeholder at game creation and is saved as-is.

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
  asks it through a callback). The game screen uses the same pattern
  (`#play-error`, `showError(message)` / `clearError()` in `PlayScreenUI`,
  cleared at the start of the next user action), in the sticky middle row so it
  stays visible; `PlayScreenUI.onError(exception)` (used by `PlayScreenUI`
  itself and by `LotteryUI`) writes into it instead of calling `alert`. Errors
  raised while a modal (e.g. `lottery-modal`) is open still land in
  `#play-error`, which sits behind the modal until it is closed. Per-field
  messages (`is-invalid` + `invalid-feedback`) are a possible later
  improvement.
- **Callbacks to model methods**: pass arrow functions
  (`(v) => game.getCurrentPlayerTurn().addMoney(v)`), never the bare method
  (`player.addMoney`, it loses `this`). The arrow resolves the current player
  at call time.
- **User text in the DOM**: always `textContent`, never `innerHTML` (names are
  typed by the user).
- **Accessibility**: buttons with only a symbol (`+`, `−`, `✓`, `X`) and
  inputs without a visible `<label>` have an `aria-label`, translated like any
  other text (`data-i18n-aria-label` or `t()`, see "Translations").
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
  Text shown to the player is never written inline: it goes through the
  dictionaries (see "Translations (i18n)").
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

- PWA (future): the Lifepod will be used on a phone at the game table. With a
  Service Worker and a `manifest.json` it could work offline and be installed
  as an app, and it would also give fullscreen on iPhone (via the manifest
  `display` setting), where the Fullscreen API is not available.
- Visual direction ("it must not look like a business app"): ideas, in
  increasing cost.
  1. **Done.** Theme, only Sass variables: a game-like saturated palette (from
     the player colors and the Game of Life look) with a colored dark
     background instead of neutral gray; a font with character for title and
     numbers (Fredoka, from Google Fonts) instead of `system-ui`; very rounded
     corners and pill buttons (`$border-radius`, `$btn-border-radius`).
     Applies to the main menu too.
  2. **Done.** Numbers and buttons at the center of attention (game screen):
     money and Life Points are large (`.stat-value`) with a small label below
     (`.stat-label`); Spin is a big circular button (`.btn-spin`) with a
     shadow and a press effect (`:active { transform: scale(...) }`); icons
     (Bootstrap Icons) instead of `+`, `−`, `↔`, and the `X`/`✓` symbols.
  3. **Done.** Player identity: the screen is tinted with the color of the
     player whose turn it is (player name, sticky row border, Spin ring). See
     "Player identity tint" under "Game screen" → "Responsive behavior".
  4. **Done.** Life and feedback: the delta toasts and the count-up
     animation for money and Life Points (see "Value change feedback"); the
     roll/chance result is drawn in `roll-modal` (`RollingAnimation`); at the
     end of the game the scoreboard is revealed row by row
     (`revealScoreboard`), and the end of the winner's count-up fires a
     confetti burst and the win tune.
  5. **Done.** Remove "business" signals: the game screen's buttons (and the
     `kids-modal`/`houses-modal`/`cars-modal`/`confirm-modal`/`lottery-modal`
     buttons) went from unstyled plain `<button>`s to `btn`/`btn-outline-*`;
     the scoreboard table lost its default borders (`table-borderless`).
- Optional rules (house rules) in the backend (`HouseRules`: unlimited kids,
  balanced rolling, lottery jackpot bonus with no winner): decision postponed
  (low priority), to be settled where they are enabled in the interface and
  whether they can be changed mid-game.
- End of game: `game.endGame` sells the assets and converts money into
  rounded Life Points through `conversionRatio`; `game.getRanking()` returns a
  sorted copy of the players. The scoreboard is a plain table inside the game
  screen; a dedicated end-of-game screen (new game, back to the menu) is still
  missing, and so is a rule for ties (same rank or not).
- Cells of the game screen still empty (lottery pot/pick display outside its
  modal, board spaces) and `Player` has no getters for `assets`/`qualification`
  (`marry` should be renamed `married`).
