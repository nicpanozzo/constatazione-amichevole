/* Generazione del PDF di riepilogo direttamente nel browser (jsPDF caricato solo quando serve). */
'use strict';

let jsPDFLoading = null;
function loadJsPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  jsPDFLoading ||= new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'vendor/jspdf.umd.min.js';
    sc.onload = () => res(window.jspdf.jsPDF);
    sc.onerror = () => { jsPDFLoading = null; rej(new Error('jsPDF non caricato')); };
    document.head.append(sc);
  });
  return jsPDFLoading;
}

function imgSize(src) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => res(null);
    i.src = src;
  });
}

// I font standard del PDF coprono solo l'alfabeto latino: sostituisco il resto.
function pdfText(v) {
  return String(v ?? '')
    .replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/→/g, '->')
    .replace(/[^\n\x20-\xFF€]/g, '');
}

async function buildPDF() {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 12, CW = W - 2 * M;
  const LH = 4.1; // altezza riga a 9pt
  const C = { a: [37, 99, 235], b: [202, 138, 4], grey: [100, 116, 139], line: [203, 213, 225], fill: [241, 245, 249], red: [220, 38, 38] };
  let y = M;

  const newPage = () => { doc.addPage(); y = M; };
  const ensure = hh => { if (y + hh > H - M - 8) newPage(); };
  const yn = v => (v === 'si' ? 'Sì' : v === 'no' ? 'No' : '');
  const join = (arr, sep = ', ') => arr.filter(Boolean).join(sep);
  const I = S.incidente;

  // Intestazione
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42);
  doc.text('Constatazione amichevole di incidente', M, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.grey);
  doc.text(pdfText('Riepilogo di supporto al modulo CAI - generato il ' + new Date().toLocaleString('it-IT')), M, y + 10);
  y += 15;

  // Tabella generica a 3 colonne: etichetta | A | B (oppure etichetta | valore)
  const colL = 40, colV = (CW - colL) / 2;
  function section(title) {
    ensure(14);
    doc.setFillColor(...C.fill); doc.rect(M, y, CW, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
    doc.text(pdfText(title), M + 2, y + 4.2);
    y += 6;
  }
  function row(label, a, b) {
    doc.setFontSize(9);
    const two = b !== undefined;
    const wv = two ? colV - 3 : CW - colL - 3;
    const la = doc.splitTextToSize(pdfText(label), colL - 3);
    const va = doc.splitTextToSize(pdfText(a || '-'), wv);
    const vb = two ? doc.splitTextToSize(pdfText(b || '-'), wv) : [];
    const hh = Math.max(la.length, va.length, vb.length) * LH + 2;
    ensure(hh);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.grey); doc.text(la, M + 2, y + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(va, M + colL, y + 4);
    if (two) doc.text(vb, M + colL + colV, y + 4);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.2); doc.line(M, y + hh, M + CW, y + hh);
    y += hh;
  }

  section('Incidente');
  row('1. Data e ora', join([fmtDate(I.data), I.ora], ' ore '));
  row('2. Luogo', join([I.luogo, I.comune, I.paese]));
  if (I.coords) row('Coordinate GPS', I.coords);
  row('3. Feriti anche lievi', yn(I.feriti));
  row('4. Danni materiali', join([I.danniAltriVeicoli && 'ad altri veicoli: ' + yn(I.danniAltriVeicoli), I.danniOggetti && 'a oggetti: ' + yn(I.danniOggetti)], ' - '));
  row('5. Testimoni', I.testimoni);
  y += 4;

  // Intestazione colonne A / B
  ensure(10);
  doc.setFillColor(...C.a); doc.rect(M + colL, y, colV - 1, 7, 'F');
  doc.setFillColor(...C.b); doc.rect(M + colL + colV, y, colV, 7, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text('VEICOLO A', M + colL + 2, y + 4.8); doc.text('VEICOLO B', M + colL + colV + 2, y + 4.8);
  y += 7;

  const A = S.A, B = S.B;
  const both = fn => [fn(A), fn(B)];
  const name = o => join([o.cognome, o.nome], ' ');
  section('6. Contraente / Assicurato');
  row('Nome', ...both(P => name(P.contraente)));
  row('C.F. / P. IVA', ...both(P => P.contraente.codiceFiscale));
  row('Indirizzo', ...both(P => join([P.contraente.indirizzo, join([P.contraente.cap, P.contraente.comune], ' '), P.contraente.stato])));
  row('Telefono / e-mail', ...both(P => join([P.contraente.tel, P.contraente.email], ' - ')));
  section('7. Veicolo');
  row('Tipo / marca', ...both(P => join([P.veicolo.tipo, P.veicolo.marca], ' - ')));
  row('Targa', ...both(P => join([P.veicolo.targa, P.veicolo.statoImm && '(' + P.veicolo.statoImm + ')'], ' ')));
  row('Rimorchio', ...both(P => join([P.veicolo.rimorchioTarga, P.veicolo.rimorchioStato], ' - ')));
  section('8. Impresa di assicurazione');
  row('Compagnia', ...both(P => P.assic.compagnia));
  row('Polizza n.', ...both(P => P.assic.polizza));
  row('Carta verde', ...both(P => P.assic.cartaVerde));
  row('Validità', ...both(P => join([fmtDate(P.assic.validaDal) && 'dal ' + fmtDate(P.assic.validaDal), fmtDate(P.assic.validaAl) && 'al ' + fmtDate(P.assic.validaAl)], ' ')));
  row('Agenzia', ...both(P => join([P.assic.agenzia, P.assic.agenziaIndirizzo, P.assic.agenziaTel], ' - ')));
  row('Danni propri coperti', ...both(P => yn(P.assic.danniPropri)));
  section('9. Conducente');
  row('Nome', ...both(P => name(P.conducente)));
  row('Data di nascita', ...both(P => fmtDate(P.conducente.nascita)));
  row('Codice fiscale', ...both(P => P.conducente.codiceFiscale));
  row('Indirizzo', ...both(P => join([P.conducente.indirizzo, P.conducente.stato])));
  row('Telefono / e-mail', ...both(P => join([P.conducente.tel, P.conducente.email], ' - ')));
  row('Patente', ...both(P => join([P.conducente.patente, P.conducente.categoria && 'cat. ' + P.conducente.categoria, P.conducente.patenteScad && 'valida fino al ' + fmtDate(P.conducente.patenteScad)], ' - ')));

  // 10. Punto d'urto con disegno
  section("10. Punto d'urto iniziale");
  ensure(40);
  const drawCar = (X, x0, y0) => {
    const k = 0.12;
    doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4);
    doc.roundedRect(x0 + 30 * k, y0 + 15 * k, 140 * k, 230 * k, 4, 4, 'S');
    ZONE.forEach(([id, , x, yy, w, hh]) => {
      if (S[X].urto.includes(id)) { doc.setFillColor(...C.red); doc.rect(x0 + x * k, y0 + yy * k, w * k, hh * k, 'F'); }
    });
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.grey);
    doc.text('davanti', x0 + 100 * k, y0 + 1, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(pdfText(urtoText(X) || '-'), colV - 32), x0 + 28, y0 + 6);
  };
  drawCar('A', M + colL, y + 2); drawCar('B', M + colL + colV, y + 2);
  y += 37;
  doc.setDrawColor(...C.line); doc.line(M, y, M + CW, y);
  section('11. Danni visibili');
  row('Descrizione', A.danni, B.danni);
  section('12. Circostanze');
  CIRCOSTANZE.forEach((t, i) => {
    const n = i + 1;
    if (!A.circ.includes(n) && !B.circ.includes(n)) return;
    row(`${n}. ${t}`, A.circ.includes(n) ? 'X' : '', B.circ.includes(n) ? 'X' : '');
  });
  row('Caselle segnate', String(A.circ.length), String(B.circ.length));
  section('14. Osservazioni');
  row('Osservazioni', A.osservazioni, B.osservazioni);

  // 15. Firme
  section('15. Firme dei conducenti');
  ensure(30);
  for (const [i, X] of ['A', 'B'].entries()) {
    const x0 = M + colL + i * colV;
    if (S.firme[X]) {
      const sz = await imgSize(S.firme[X]);
      const w = colV - 6, hh = sz ? Math.min(24, w * sz.h / sz.w) : 20;
      doc.addImage(S.firme[X], 'PNG', x0, y + 1, w, hh, 'firma' + X, 'FAST');
    } else {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...C.red); doc.text('Non firmato', x0, y + 10);
    }
    doc.setDrawColor(15, 23, 42); doc.line(x0, y + 26, x0 + colV - 6, y + 26);
  }
  y += 30;

  // Avvertenza controlli
  const ck = checks();
  if (ck.length) {
    section('Da ricontrollare');
    ck.forEach(c => row('-', c.msg));
  }

  // 13. Schizzo
  const sk = sketchDataURL();
  if (sk) {
    const sz = await imgSize(sk);
    const hh = CW * (sz ? sz.h / sz.w : 0.7);
    if (y + hh + 10 > H - M - 8) newPage();
    section("13. Grafico dell'incidente");
    doc.setDrawColor(...C.line); doc.rect(M, y + 1, CW, hh);
    doc.addImage(sk, 'PNG', M, y + 1, CW, hh, 'schizzo', 'FAST');
    y += hh + 4;
  }

  // Foto, due per riga
  if (S.photos.length) {
    newPage();
    section(`Foto (${S.photos.length})`);
    y += 2;
    const pw = (CW - 6) / 2;
    for (let i = 0; i < S.photos.length; i += 2) {
      const pair = await Promise.all(S.photos.slice(i, i + 2).map(async p => {
        const sz = await imgSize(p.data);
        const r = sz ? sz.h / sz.w : 0.75;
        const ph = Math.min(85, pw * r);
        return { p, w: ph / r, h: ph };
      }));
      const rowH = Math.max(...pair.map(x => x.h));
      ensure(rowH + 8);
      pair.forEach((x, j) => {
        const x0 = M + j * (pw + 6);
        try { doc.addImage(x.p.data, 'JPEG', x0, y, x.w, x.h); } catch { /* immagine illeggibile */ }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.grey);
        doc.text(pdfText(`${i + j + 1}. ${x.p.caption || ''}`), x0, y + x.h + 4);
      });
      y += rowH + 8;
    }
  }

  // Nota finale
  ensure(16);
  y += 2;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.grey);
  doc.text(doc.splitTextToSize(pdfText('Documento di supporto: non sostituisce il modulo CAI ufficiale. Il sinistro va denunciato alla propria compagnia entro 3 giorni. Generato con il sito Constatazione Amichevole, non affiliato ad ANIA o a compagnie assicurative.'), CW), M, y + 3);

  // Piè di pagina
  const n = doc.getNumberOfPages();
  const targhe = join([A.veicolo.targa, B.veicolo.targa], ' / ');
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(...C.grey); doc.setFont('helvetica', 'normal');
    doc.text(pdfText(join(['Constatazione amichevole', fmtDate(I.data), targhe], ' - ')), M, H - 6);
    doc.text(`Pagina ${i} di ${n}`, W - M, H - 6, { align: 'right' });
  }
  return doc.output('blob');
}

async function makePDF(mode, btn) {
  const label = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Creo il PDF…'; }
  try {
    const blob = await buildPDF();
    const name = fileBase() + '.pdf';
    if (mode === 'share') await shareOrDownload(blob, name, 'Constatazione amichevole');
    else downloadBlob(blob, name);
  } catch (e) {
    console.error(e);
    toast('Non riesco a creare il PDF: usa "Stampa" e scegli "Salva come PDF".', 5000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }
}
