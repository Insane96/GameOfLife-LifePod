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
  palette con viola e verde acqua per i due giocatori extra. Ogni giocatore è
  sempre identificato da colore + iniziale/nome, mai dal solo colore
  (accessibilità).
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

## Nota su Bootstrap

Il look di default è troppo generico per l'obiettivo moderno/minimal
concordato. Sovrascrivere le CSS variable di Bootstrap (`--bs-border-radius`,
`--bs-body-font-family`, palette colori) invece di usare i default as-is.

## Aperto / da decidere

- Undo: limitato all'ultima azione o pila di più azioni nel turno?
- Flusso di inserimento nomi/colori giocatori in fase di "Nuova partita".