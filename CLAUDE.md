# Lifepod digitale

## Cos'è

Sostituto digitale del solo dispositivo elettronico Lifepod del gioco da tavolo
"The Game of Life: Twists & Turns". **Non sostituisce l'intero gioco**: tabellone,
carte, pedine e regolamento restano fisici. L'app rimpiazza solo il dispositivo
che i giocatori usavano per tracciare stipendio, Life Points, famiglia, casa,
auto e per generare il risultato dello spin al posto della ruota.

Riferimento sul dispositivo originale, per contesto: si inseriva la propria
carta Visa personale a inizio turno, il dispositivo generava il risultato dello
spin, calcolava stipendio e Life Points, teneva traccia di famiglia/casa/auto,
e aveva pulsanti dedicati per i vari eventi di gioco (vedi le "Lifepod reference
cards" originali).

## Stack

- Vanilla JS/TS + Bootstrap. Niente framework (React/Vue/ecc).
- Persistenza: localStorage (vedi sezione dedicata, è un requisito critico).

## Decisioni di interfaccia prese

- **Orientamento**: landscape principale, ma deve restare utilizzabile in
  portrait. Reflow tramite media query `orientation`, non solo breakpoint di
  larghezza.
- **Giocatori**: fino a 6 (l'hardware originale ne supportava 4 tramite le
  carte Visa colorate: rosso, blu, verde, giallo). In digitale estendiamo la
  palette con magenta e nero per i due giocatori extra (vedi `PlayerColor` nel
  backend). Ogni giocatore è sempre identificato da colore + iniziale/nome,
  mai dal solo colore (accessibilità).
- **Cambio turno**: schermata esplicita di passaggio ("Fine turno" → "Chi
  gioca ora?"), non uno switcher sempre visibile toccabile in ogni momento.
  Serve a replicare la ritualità dell'inserire/togliere la carta fisica ed
  evitare azioni compiute sul turno sbagliato.
- **Layout landscape**: sidebar sinistra con lista verticale dei giocatori +
  riepilogo finanziario del giocatore attivo (saldo, Life Points, famiglia).
  Area principale a destra con bottone Spin (azione primaria, grande,
  circolare, sempre raggiungibile) e categorie di eventi (Carriera / Famiglia
  / Casa e auto / Eventi) con griglia di bottoni icona + etichetta.
- **Layout portrait**: stack verticale (barra giocatori in alto, riepilogo,
  spin, categorie, azioni), stessa gerarchia info del layout landscape.
- **Feedback cambi valore**: toast (es. "+50.000 €", "+2 Life Points")
  invece di solo aggiornamento silenzioso del numero.
- **Undo**: pulsante "Annulla ultima azione" sempre visibile vicino a "Fine
  turno". Più importante che nell'originale perché il dispositivo passa di
  mano più spesso.
- **Creazione partita**: prima si inseriscono i giocatori (nome + colore),
  poi si preme "Nuova partita", che chiama il backend (`Game.init` con il
  numero di anni) e avvia la partita.
  - Da 2 a 6 giocatori (si parte con 2 righe; "Aggiungi giocatore" / "X" per
    aggiungere e rimuovere, mai sotto 2).
  - Nome: se lasciato vuoto si usa il placeholder ("Giocatore N"); un nome
    fatto di soli spazi è invalido. Nomi duplicati non ammessi.
  - Colore: obbligatorio e univoco. Selettore a radio button stilizzati a
    cerchio; i colori già scelti da altri giocatori sono disabilitati.
  - Anni: intero tra 1 e 99, default 15 (campo vuoto → default).
  - Tutte le validazioni avvengono prima di toccare `Game`, così non si
    resta mai con una partita inizializzata a metà.
- **Lotteria**: pannello a parte, separato dalle categorie di eventi
  principali (Carriera / Famiglia / Casa e auto / Eventi).
- **Schermata di gioco (implementata in parte)**: griglia Bootstrap a 3 righe
  (`container-fluid`, `min-vh-100`, `d-flex flex-column`, righe con
  `flex-grow-1`), con il contenuto di ogni cella ancorato alla sua posizione
  (alto-sinistra, alto-centro, alto-destra, ecc.).
  - In alto: lotteria/stipendio/iniziativa, case e auto, spazi del tabellone
    (celle ancora vuote).
  - Al centro: nome del giocatore di turno, denaro e punti vita, ciascuno con
    i pulsanti `+` / `−` che aprono un campo numerico (`inputmode="numeric"`)
    con conferma ✓. Un solo campo aperto alla volta, gestito da
    `PlayScreenUI._operation` (enum `Operation`).
  - In basso: volume (vuoto), "VIA!" al centro, anni rimanenti e "Termina
    turno" a destra.
  - **Flusso del turno**: "VIA!" (`Player.onGo()`) accredita stipendio e
    bonus e sblocca "Termina turno"; "Termina turno" (`Game.endTurn()`) lancia
    un errore se VIA! non è stato premuto. "VIA!" si può premere una volta per
    turno. Cambiando turno si chiude l'operazione aperta e si svuotano i
    campi.
  - **Fine partita**: a `Game.years <= 0` `endGame` imposta
    `currentPlayerTurn` sul vincitore, `render()` mostra "Vincitore: nome" e
    disattiva/nasconde VIA! e i pulsanti +/−.

## Persistenza (localStorage) — requisito critico

Se la pagina si ricarica per sbaglio, la partita non deve andare persa.

- Scrivere l'intero stato di gioco ad ogni singola azione (spin, evento
  applicato, cambio turno). Scritture piccole e istantanee, non serve
  debounce.
- All'avvio, se esiste uno stato salvato: chiedere sempre esplicitamente
  "Riprendi partita" vs "Nuova partita". Mai riprendere o cancellare in
  automatico senza chiedere.
- Serve un'azione esplicita "Nuova partita" da qualche parte nell'interfaccia
  (impostazioni o angolo dello schermo) per azzerare deliberatamente lo
  storage a fine partita.

## Deploy (GitHub Pages)

- Il sito è statico e viene pubblicato su GitHub Pages dal workflow
  `.github/workflows/deploy.yml`, a ogni push su `master` (o manualmente da
  Actions). In *Settings → Pages* la sorgente deve essere "GitHub Actions".
- Il workflow esegue `npm ci` e `npm run build`, poi assembla `_site/` con
  solo `index.html`, `dist/` e `bootstrap.bundle.min.js`. Quest'ultimo è
  copiato in `node_modules/bootstrap/dist/js/` (stesso percorso dell'HTML) così
  `index.html` funziona uguale in locale e online. Se si sposta Bootstrap,
  aggiornare HTML e workflow insieme.
- `dist/` e `node_modules/` restano nel `.gitignore`: non vanno committati.
- I percorsi in `index.html` devono restare **relativi** (il sito vive sotto
  `/GameOfLife-LifePod/`, non alla radice del dominio).
- `localStorage` è condiviso per origine (`insane96.github.io`), quindi tutte
  le chiavi usano un prefisso (`lifepod.`), per non collidere con altri
  progetti pubblicati dallo stesso account.

## Nota su Bootstrap

Il look di default è troppo generico per l'obiettivo moderno/minimal
concordato. Sovrascrivere le CSS variable di Bootstrap (`--bs-border-radius`,
`--bs-body-font-family`, palette colori) invece di usare i default as-is.

## Convenzioni di codice

- **HTML vs TS**: la struttura statica (contenitori, schermate, bottoni
  fissi) si scrive a mano in `index.html`; TS genera/clona solo ciò che è
  dinamico (es. righe giocatore). Niente `onclick` inline: gli eventi si
  agganciano da TS con `addEventListener`.
- **Id e classi**: kebab-case. Prefisso `btn-` per i bottoni e `input-`/`txt-`
  per i campi di input; nessun prefisso per contenitori e schermate
  (`start-screen`, `players-list`).
- **UI a componenti**: una classe per componente (es. `DOMPlayer`), che riceve
  callback dal contenitore invece di importarlo (niente import circolari).
  Lo stato dipendente da più elementi (es. colori disabilitati) si ricalcola
  da zero in un'unica funzione, non con aggiornamenti incrementali.
- **Rendering**: un'unica funzione `render()` per schermata rilegge lo stato
  e riscrive tutto il DOM (testi, bottoni attivi/disattivati, elementi
  nascosti con `classList.toggle("d-none", condizione)`). Ogni handler fa:
  azione sul modello, poi `render()`. Gli handler racchiudono le chiamate al
  modello in `try/catch` con `alert` (i setter lanciano fuori dal range).
- **Callback a metodi del modello**: passare arrow function
  (`(v) => Game.getCurrentPlayerTurn().addMoney(v)`), mai il metodo nudo
  (`player.addMoney`, perde il `this`). L'arrow risolve il giocatore di turno
  al momento della chiamata.
- **Testo utente nel DOM**: sempre `textContent`, mai `innerHTML` (i nomi li
  scrive l'utente).
- **Accessibilità**: i bottoni con solo un simbolo (`+`, `−`, `✓`, `X`) e gli
  input senza `<label>` visibile hanno `aria-label` in italiano ("punti vita"
  nell'interfaccia; "Life Points" resta solo nel codice e in questa
  documentazione).
- **Input numerici**: `type="text" inputmode="numeric" pattern="[0-9]*"`;
  `parseInt` + `Number.isNaN` prima di chiamare il modello. Il backend
  rifiuta comunque `NaN` e i valori fuori range.
- **Export**: solo nominali (`export class X`), niente `export default`.
- **Modelli vs UI**: il backend (`Game`, `Player`, ...) non conosce mai il DOM.
- **Moduli ES nativi, senza bundler**: gli import relativi vogliono
  l'estensione `.js` (`import {X} from "./X.js"`); `package.json` ha
  `"type": "module"` e `tsconfig` usa `NodeNext`.
- **Sviluppo**: `npm run dev` builda, avvia i watcher (`tsc` e `sass`), un
  server statico su `localhost:5500` e apre il browser.

## Modalità di collaborazione

- Non scrivere codice (modifiche a file esistenti o nuovi file) a meno che non
  sia richiesto espressamente. Se durante una review o una discussione emerge
  un possibile fix, proporlo e aspettare conferma esplicita prima di
  implementarlo — non basta che l'utente dica "magari faccio X" per
  interpretarlo come una richiesta di implementazione. La scrittura di tooling, invece, è consentita.

## Aperto / da decidere

- Undo: limitato all'ultima azione o pila di più azioni nel turno?
- Persistenza localStorage: non ancora implementata (il bottone "Continua
  partita" è un segnaposto). `Game` è tutto statico e senza reset per una
  nuova partita; gli `Asset` contengono funzioni, quindi vanno salvati per
  nome e ricostruiti, non serializzati.
- Traduzioni: rimandate. Quando servirà: IT + EN, helper `t(key)` fatto a
  mano con dizionari TS (il tipo dell'inglese vincolato alle chiavi
  dell'italiano), nessuna libreria esterna.
- PWA (futuro): il Lifepod si userà sul telefono al tavolo da gioco. Con un
  Service Worker e un `manifest.json` potrebbe funzionare offline e
  installarsi come app.
- Regole opzionali (house rules) nel backend (`HouseRules`: figli illimitati,
  tiro bilanciato, bonus jackpot lotteria senza vincitore): decisione
  rimandata a dopo (bassa priorità), da sistemare dove si attivano
  nell'interfaccia e se sono modificabili a partita in corso.
- Fine partita: la logica backend c'è (`Game.endGame`: vende gli asset,
  converte il denaro in Life Points arrotondati tramite `conversionRatio` e
  calcola il vincitore). Per ora la UI mostra il vincitore riusando
  `currentPlayerTurn`, che `endGame` sovrascrive (scorciatoia: perde
  l'informazione di chi era di turno); manca la schermata di fine
  partita/classifica, che dovrà leggere `Game.winner` e i punteggi.
- Toast dei delta ("+50.000 €") non ancora implementati: previsto un confronto
  tra i valori prima/dopo l'azione (snapshot) in `PlayScreenUI`, senza eventi
  nel modello.
- Celle della schermata di gioco ancora vuote (lotteria, case e auto, spazi
  del tabellone, volume) e `Player` senza getter per `assets`/`qualification`
  (`marry` andrebbe rinominato `married`).
- Nome giocatore fatto di soli spazi: `DOMPlayer.getName()` ora lo sostituisce
  col placeholder (`trim() || placeholder`), mentre la regola di creazione
  partita lo dichiara invalido: decidere quale dei due vale.