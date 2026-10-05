# Constatazione Amichevole

Sito web (statico, mobile-first, in italiano) che guida i due conducenti nella compilazione della **constatazione amichevole di incidente (modulo CAI)** subito dopo un incidente tra due veicoli.

## Funzioni

- **Checklist di sicurezza** e chiamata rapida al 112.
- **Tutte le sezioni del modulo CAI**: data, luogo (con GPS e indirizzo automatico), feriti, testimoni, contraente, veicolo, assicurazione, conducente, punto d'urto, danni, le 17 circostanze, grafico, osservazioni, firme.
- **Passaggio dati tra i due telefoni con QR code**: ognuno compila i propri dati e li passa all'altro, niente da dettare o ricopiare.
- **"I miei dati salvati"**: salvi in anticipo auto, assicurazione e patente e li inserisci con un tocco.
- **Schizzo dell'incidente** con mano libera, frecce, rettangoli per i veicoli ed etichette A/B/STOP.
- **Foto** dalla fotocamera o dalla galleria, ridimensionate e descritte.
- **Firme** con il dito per entrambi i conducenti.
- **Riepilogo stampabile / PDF** (A4) con tutti i dati, lo schizzo, le foto e le firme; condivisione testo e backup JSON.
- **Funziona offline** (service worker) e si può installare come app.

## Privacy

Nessun backend: tutti i dati restano nel browser del dispositivo (IndexedDB / localStorage). Il passaggio dati tra telefoni avviene tramite il QR code o il link, che contengono i dati stessi. L'unica chiamata esterna opzionale è a OpenStreetMap Nominatim per trasformare la posizione GPS in indirizzo.

## Avvio in locale

È un sito statico: basta servire la cartella, ad esempio

```bash
python3 -m http.server 8000
```

e aprire http://localhost:8000.

## Pubblicazione

Pubblicato con GitHub Pages dal branch `main` (cartella radice).

> Questo strumento è un aiuto alla compilazione: non sostituisce il modulo CAI ufficiale né la denuncia di sinistro alla propria compagnia (da fare entro 3 giorni). Non è affiliato con ANIA né con alcuna compagnia assicurativa.
