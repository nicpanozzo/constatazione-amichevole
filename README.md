# Constatazione Amichevole

Sito web (statico, mobile-first, in italiano) che guida i due conducenti nella compilazione della **constatazione amichevole di incidente (modulo CAI)** subito dopo un incidente tra due veicoli.

## Funzioni

- **Checklist di sicurezza** e chiamata rapida al 112.
- **Tutte le sezioni del modulo CAI**: data, luogo (con GPS e indirizzo automatico), feriti, testimoni, contraente, veicolo, assicurazione, conducente, punto d'urto, danni, le 17 circostanze, grafico, osservazioni, firme.
- **Passaggio dati tra i due telefoni con QR code**: ognuno compila i propri dati e li passa all'altro.
- **Passaggio dell'intera constatazione** (con foto, schizzo e firme) come file, così entrambi ne hanno una copia identica.
- **"I miei dati salvati"**: salvi in anticipo auto, assicurazione e patente e li inserisci con un tocco.
- **Circostanze anche in inglese** (stessa numerazione del modulo europeo) per un conducente straniero.
- **Controlli automatici**: polizza scaduta o non ancora valida, patente scaduta, targa italiana dal formato insolito, stessa targa su A e B.
- **Link alla verifica della copertura RC** sul Portale dell'Automobilista.
- **Schizzo dell'incidente** con mano libera, frecce, rettangoli per i veicoli ed etichette A/B/STOP.
- **Foto guidate**: elenco degli scatti consigliati (targhe, danni, posizione, segnaletica, documenti) con spunta.
- **Firme** con il dito per entrambi i conducenti.
- **PDF generato direttamente sul telefono**, da scaricare o inviare (WhatsApp, e-mail…), con tabella A/B, punti d'urto, circostanze, firme, schizzo e foto. Resta disponibile anche la stampa.
- **Promemoria della denuncia** entro 3 giorni, da aggiungere al calendario (.ics).
- **Archivio** delle constatazioni passate, riapribili in ogni momento.
- **Funziona offline** (service worker), tiene lo schermo acceso durante la compilazione e si può installare come app.

## Privacy

Nessun backend: tutti i dati restano nel browser del dispositivo (IndexedDB / localStorage). Il passaggio dati tra telefoni avviene tramite il QR code, il link o il file .json, che contengono i dati stessi. L'unica chiamata esterna opzionale è a OpenStreetMap Nominatim per trasformare la posizione GPS in indirizzo.

## Avvio in locale

È un sito statico: basta servire la cartella, ad esempio

```bash
python3 -m http.server 8000
```

e aprire http://localhost:8000.

## Librerie incluse

- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT)
- [jsPDF](https://github.com/parallax/jsPDF) (MIT)

## Pubblicazione

Pubblicato con GitHub Pages dal branch `main` (cartella radice).

> Questo strumento è un aiuto alla compilazione: non sostituisce il modulo CAI ufficiale né la denuncia di sinistro alla propria compagnia (da fare entro 3 giorni). Non è affiliato con ANIA né con alcuna compagnia assicurativa.
