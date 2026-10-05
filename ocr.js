/* Lettura automatica dei documenti (OCR) direttamente sul telefono con Tesseract.js.
   Le immagini non lasciano il dispositivo: motore e modello italiano sono serviti da questo sito. */
'use strict';

const OCR_DOCS = {
  libretto: { label: 'Libretto (carta di circolazione)', icon: '🚗' },
  patente: { label: 'Patente', icon: '🪪' },
  assic: { label: 'Certificato di assicurazione', icon: '📄' },
};

const COMPAGNIE = [
  'Allianz Direct', 'Allianz', 'Generali', 'UnipolSai', 'Unipol', 'AXA', 'Zurich Connect', 'Zurich', 'Reale Mutua', 'Italiana Assicurazioni',
  'Cattolica', 'Vittoria', 'Sara Assicurazioni', 'Groupama', 'HDI', 'Helvetia', 'ITAS', 'Verti', 'Genertel', 'Linear', 'ConTe.it', 'Prima',
  'Quixa', 'Direct Line', 'Genialloyd', 'Admiral', 'Bene Assicurazioni', 'Nobis', 'Hellas', 'Revo', 'Tua Assicurazioni', 'Alleanza', 'Arca',
  'Nationale Suisse', 'Assimoco', 'Elba', 'Amissima', 'Net Insurance', 'Great Lakes', 'Ergo', 'Mapfre', 'Toro', 'Fondiaria', 'Milano Assicurazioni',
];

/* ---------- Motore ---------- */

let ocrWorker = null;
function abs(p) { return new URL(p, location.href).href; }
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script ' + src));
    document.head.append(s);
  });
}
let ocrProgress = () => {};
async function getOcrWorker() {
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await loadScript('vendor/tesseract/tesseract.min.js');
  ocrWorker = Tesseract.createWorker('ita', 1, {
    workerPath: abs('vendor/tesseract/worker.min.js'),
    corePath: abs('vendor/tesseract/'),
    langPath: abs('vendor/tesseract/lang'),
    logger: m => ocrProgress(m),
  }).catch(e => { ocrWorker = null; throw e; });
  return ocrWorker;
}

// Ridimensiona, porta in scala di grigi e alza il contrasto: aiuta molto sulle foto storte o in ombra.
function prepareForOcr(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2200 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height); const px = d.data;
      let min = 255, max = 0;
      const g = new Uint8ClampedArray(px.length / 4);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        g[j] = v; if (v < min) min = v; if (v > max) max = v;
      }
      const span = Math.max(1, max - min);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) {
        const v = ((g[j] - min) / span) * 255;
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      ctx.putImageData(d, 0, 0);
      URL.revokeObjectURL(img.src);
      res(c);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- Riconoscimento dei campi ---------- */

const RE_TARGA = /\b([A-Z]{2})\s?(\d{3})\s?([A-Z]{2})\b/;
const RE_CF = /\b[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]\b/;
const RE_DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g;

function toIso(d, m, y, birth = false) {
  d = +d; m = +m; y = +y;
  if (y < 100) y += (birth ? (y > (new Date().getFullYear() % 100) ? 1900 : 2000) : 2000);
  if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && y > 1900 && y < 2100)) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function datesIn(s, birth) {
  return [...s.matchAll(RE_DATE)].map(m => toIso(m[1], m[2], m[3], birth)).filter(Boolean);
}
function clean(s) { return (s || '').replace(/\s+/g, ' ').replace(/^[\s:;.,)\-]+|[\s:;,(\-]+$/g, '').trim(); }
function titleCase(s) { return clean(s).toLowerCase().replace(/(^|[\s'-])\p{L}/gu, c => c.toUpperCase()); }

// Correzioni tipiche dell'OCR nelle parti numeriche/alfabetiche
function fixDigits(s) { return s.replace(/[O]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/B/g, '8').replace(/Z/g, '2'); }
function fixLetters(s) { return s.replace(/0/g, 'O').replace(/1/g, 'I').replace(/5/g, 'S').replace(/8/g, 'B').replace(/2/g, 'Z'); }

function findTarga(text) {
  const t = text.toUpperCase();
  let m = t.match(RE_TARGA);
  if (m) return m[1] + m[2] + m[3];
  // tolleranza: 7 caratteri alfanumerici con lettere/cifre confuse
  for (const w of t.match(/\b[A-Z0-9]{2}\s?[A-Z0-9]{3}\s?[A-Z0-9]{2}\b/g) || []) {
    const x = w.replace(/\s/g, '');
    const fixed = fixLetters(x.slice(0, 2)) + fixDigits(x.slice(2, 5)) + fixLetters(x.slice(5));
    if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(fixed) && /\d/.test(x)) return fixed;
  }
  return '';
}

const CF_MONTHS = 'ABCDEHLMPRST';
function cfBirthDate(cf) {
  if (!cf || cf.length !== 16) return '';
  const om = { L: 0, M: 1, N: 2, P: 3, Q: 4, R: 5, S: 6, T: 7, U: 8, V: 9 };
  const num = s => s.replace(/[LMNPQRSTUV]/g, c => om[c]);
  const y = +num(cf.slice(6, 8)), m = CF_MONTHS.indexOf(cf[8]) + 1;
  let d = +num(cf.slice(9, 11)); if (d > 40) d -= 40;
  return toIso(d, m, y, true);
}

// Valore dopo un codice di campo europeo, es. "D.1" o "4b." su una riga
function afterCode(lines, codeRe) {
  for (const l of lines) {
    const m = l.match(codeRe);
    if (m) { const v = clean(l.slice(m.index + m[0].length)); if (v) return v; }
  }
  return '';
}

function parseLibretto(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const out = [];
  const targa = findTarga(afterCode(lines, /^\(?A[.)\s]/i)) || findTarga(text);
  if (targa) out.push(['veicolo.targa', 'Targa', targa]);
  const marca = afterCode(lines, /\bD\s?\.\s?1\b[.)]?/i);
  const modello = afterCode(lines, /\bD\s?\.\s?3\b[.)]?/i);
  const mm = clean([marca, modello].filter(Boolean).join(' ')).replace(/\s*\(.*$/, '');
  if (mm) out.push(['veicolo.marca', 'Marca e modello', titleCase(mm)]);
  // Intestatario: C.2.1/C.2.2 (proprietario) oppure C.1.1/C.1.2
  const cogn = afterCode(lines, /\bC\s?\.\s?[12]\s?\.\s?1\b[.)]?/i);
  const nome = afterCode(lines, /\bC\s?\.\s?[12]\s?\.\s?2\b[.)]?/i);
  const ind = afterCode(lines, /\bC\s?\.\s?[12]\s?\.\s?3\b[.)]?/i);
  if (cogn) out.push(['contraente.cognome', 'Cognome intestatario (contraente?)', titleCase(cogn)]);
  if (nome) out.push(['contraente.nome', 'Nome intestatario (contraente?)', titleCase(nome)]);
  if (ind) {
    const cap = ind.match(/\b\d{5}\b/);
    if (cap) {
      out.push(['contraente.indirizzo', 'Indirizzo intestatario', titleCase(ind.slice(0, cap.index))]);
      out.push(['contraente.cap', 'CAP', cap[0]]);
      const com = titleCase(ind.slice(cap.index + 5)).replace(/\s\(?([A-Za-z]{2})\)?$/, (m, pr) => ` (${pr.toUpperCase()})`);
      out.push(['contraente.comune', 'Comune', com]);
    } else out.push(['contraente.indirizzo', 'Indirizzo intestatario', titleCase(ind)]);
  }
  const t = text.toUpperCase();
  if (/MOTOCICLO/.test(t)) out.push(['veicolo.tipo', 'Tipo', 'Motociclo']);
  else if (/CICLOMOTORE/.test(t)) out.push(['veicolo.tipo', 'Tipo', 'Ciclomotore']);
  else if (/AUTOCARRO/.test(t)) out.push(['veicolo.tipo', 'Tipo', 'Autocarro']);
  else if (/AUTOVETTURA/.test(t)) out.push(['veicolo.tipo', 'Tipo', 'Autovettura']);
  if (targa) out.push(['veicolo.statoImm', 'Stato di immatricolazione', 'Italia']);
  return out;
}

function parsePatente(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const out = [];
  const field = n => afterCode(lines, new RegExp('^\\(?' + n + '\\s?[.)]\\s?', 'i'));
  const cogn = field('1'), nome = field('2'), nasc = field('3');
  if (cogn && !/\d/.test(cogn)) out.push(['conducente.cognome', 'Cognome', titleCase(cogn)]);
  if (nome && !/\d/.test(nome)) out.push(['conducente.nome', 'Nome', titleCase(nome)]);
  const dn = datesIn(nasc, true)[0];
  if (dn) out.push(['conducente.nascita', 'Data di nascita', dn]);
  const scad = datesIn(afterCode(lines, /(?:^|\s)[4A]\s?b\s?[.)]\s?/i))[0];
  if (scad) out.push(['conducente.patenteScad', 'Patente valida fino al', scad]);
  let num = field('5').replace(/\s/g, '').toUpperCase();
  if (!num) num = (text.toUpperCase().match(/\b[A-Z]{2}\d{7}[A-Z]\b/) || [''])[0];
  if (num) out.push(['conducente.patente', 'Numero patente', num]);
  const cat = field('9');
  if (cat) {
    // nessuna categoria contiene I o L: l'OCR spesso legge così la barra
    const codes = cat.toUpperCase().replace(/[^A-Z0-9]|[IL]/g, ' ').match(/AM|A1|A2|B1|BE|C1E|C1|CE|D1E|D1|DE|A|B|C|D/g);
    if (codes) out.push(['conducente.categoria', 'Categorie', [...new Set(codes)].join('/')]);
  }
  // fallback se le righe numerate non sono state lette: date in ordine (nascita, rilascio, scadenza)
  if (!dn || !scad) {
    const ds = datesIn(text, false).sort();
    if (!dn && ds.length >= 2) out.push(['conducente.nascita', 'Data di nascita (da verificare)', ds[0]]);
    if (!scad && ds.length >= 2) out.push(['conducente.patenteScad', 'Patente valida fino al (da verificare)', ds[ds.length - 1]]);
  }
  return out;
}

function parseAssic(text) {
  const out = [];
  const T = text.toUpperCase();
  const comp = COMPAGNIE.find(c => T.includes(c.toUpperCase()));
  if (comp) out.push(['assic.compagnia', 'Compagnia', comp]);
  else {
    const m = text.match(/impresa(?: di assicurazione)?\s*[:.]?\s*([^\n]{3,60})/i);
    if (m) out.push(['assic.compagnia', 'Compagnia', clean(m[1])]);
  }
  const pol = text.match(/(?:polizza|contratto)\s*(?:n(?:\.|°|um(?:ero)?)?|nr\.?)?\s*[:.]?\s*([A-Z0-9][A-Z0-9/.\-]{4,})/i);
  if (pol) out.push(['assic.polizza', 'Numero di polizza', pol[1].replace(/[.\-]$/, '')]);
  const per = text.match(/dal\s*(?:le ore \d{1,2}[.:]\d{2}\s*del)?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})[\s\S]{0,60}?al\s*(?:le ore \d{1,2}[.:]\d{2}\s*del)?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  let dal = '', al = '';
  if (per) { dal = datesIn(per[1])[0] || ''; al = datesIn(per[2])[0] || ''; } else {
    const ds = [...new Set(datesIn(text))].sort();
    if (ds.length >= 2) { dal = ds[ds.length - 2]; al = ds[ds.length - 1]; }
  }
  if (dal) out.push(['assic.validaDal', 'Valida dal', dal]);
  if (al) out.push(['assic.validaAl', 'Valida al', al]);
  const targa = findTarga(text);
  if (targa) out.push(['veicolo.targa', 'Targa', targa]);
  const contr = text.match(/contraente\s*[:.]?\s*([^\n]{3,60})/i);
  if (contr && !/\d{4}/.test(contr[1])) out.push(['contraente.cognome', 'Contraente (cognome e nome)', titleCase(contr[1])]);
  const cv = text.match(/carta verde\s*(?:n\.?)?\s*[:.]?\s*([A-Z0-9/\-]{5,})/i);
  if (cv) out.push(['assic.cartaVerde', 'N. carta verde', cv[1]]);
  return out;
}

// Campi comuni a tutti i documenti
function parseCommon(text, kind) {
  const out = [];
  const t = text.toUpperCase().replace(/\s/g, ' ');
  const m = t.match(RE_CF);
  if (m) {
    const who = kind === 'patente' ? 'conducente' : 'contraente';
    out.push([`${who}.codiceFiscale`, 'Codice fiscale', m[0]]);
    if (kind === 'patente') {
      const bd = cfBirthDate(m[0]);
      if (bd) out.push(['conducente.nascita', 'Data di nascita (dal codice fiscale)', bd]);
    }
  }
  return out;
}

function parseDocument(kind, text) {
  const specific = kind === 'libretto' ? parseLibretto(text) : kind === 'patente' ? parsePatente(text) : parseAssic(text);
  const all = [...specific, ...parseCommon(text, kind)];
  const seen = new Set();
  return all.filter(([p]) => (seen.has(p) ? false : seen.add(p)));
}

/* ---------- Interfaccia ---------- */

function ocrCard(X) {
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  let kind = 'libretto';
  input.addEventListener('change', () => { const f = input.files[0]; input.value = ''; if (f) runOcr(X, kind, f); });
  return h('div', { class: 'card v' + X },
    h('strong', {}, '📸 Compila dalle foto dei documenti'),
    h('p', { class: 'muted small', style: 'margin:4px 0 0' }, 'Fotografa il documento ben dritto e con buona luce: leggo i dati e te li faccio confermare. La lettura avviene sul telefono, le foto non vengono inviate a nessuno.'),
    h('div', { class: 'btn-row' },
      Object.entries(OCR_DOCS).map(([k, d]) => h('button', { class: 'secondary', onclick: () => { kind = k; input.click(); } }, `${d.icon} ${d.label}`))),
    input);
}

async function runOcr(X, kind, file) {
  const bar = h('div', { class: 'ocr-bar' }, h('div'));
  const status = h('p', { class: 'small muted' }, 'Preparo la lettura…');
  modal(h('div', {}, h('h3', { style: 'margin-top:0' }, `${OCR_DOCS[kind].icon} Lettura ${OCR_DOCS[kind].label.toLowerCase()}`), status, bar,
    h('p', { class: 'small muted' }, 'La prima volta scarica il motore di lettura (circa 6 MB), poi funziona anche offline.')));
  const set = (txt, p) => { status.textContent = txt; if (p != null) bar.firstChild.style.width = Math.round(p * 100) + '%'; };
  ocrProgress = m => {
    if (m.status === 'recognizing text') set('Leggo il documento… ' + Math.round(m.progress * 100) + '%', m.progress);
    else if (/load|initializ/.test(m.status)) set('Carico il motore di lettura…', m.progress * 0.3);
  };
  try {
    const [canvas, worker] = await Promise.all([prepareForOcr(file), getOcrWorker()]);
    const { data } = await worker.recognize(canvas);
    const fields = parseDocument(kind, data.text || '');
    const photo = await resizeImage(file).catch(() => '');
    showOcrResult(X, kind, fields, data.text || '', photo);
  } catch (e) {
    console.error(e);
    modal(h('div', {}, h('h3', { style: 'margin-top:0' }, 'Lettura non riuscita'),
      h('p', {}, 'Non sono riuscito a leggere il documento. Riprova con una foto più nitida, oppure inserisci i dati a mano.')));
  }
}

function showOcrResult(X, kind, fields, raw, photo) {
  const box = h('div', {}, h('h3', { style: 'margin-top:0' }, `Dati letti dal ${OCR_DOCS[kind].label.toLowerCase()} · veicolo ${X}`));
  const rows = [];
  if (!fields.length) {
    box.append(h('p', {}, 'Non ho riconosciuto nessun campo. Prova una foto più vicina e dritta, senza riflessi.'));
  } else {
    box.append(h('p', { class: 'small muted', style: 'margin-top:0' }, 'Controlla e correggi prima di inserire. I campi già compilati non vengono toccati se non li selezioni.'));
    fields.forEach(([path, label, value], i) => {
      const cur = getPath(S, `${X}.${path}`) || '';
      const isDate = /nascita|valida|Scad/i.test(path);
      const cb = h('input', { type: 'checkbox', id: 'ocr' + i, checked: !cur || cur === value });
      const inp = h('input', { type: isDate ? 'date' : 'text', value, 'aria-label': label });
      rows.push({ path, cb, inp });
      box.append(h('div', { class: 'ocr-row' }, cb,
        h('div', { class: 'field', style: 'flex:1;min-width:0' },
          h('label', { for: 'ocr' + i }, label),
          inp,
          cur && cur !== value ? h('span', { class: 'small muted' }, 'Ora: ' + (isDate ? fmtDate(cur) : cur)) : null)));
    });
  }
  const keep = h('input', { type: 'checkbox', id: 'ocrKeep', checked: !!photo });
  if (photo) box.append(h('label', { class: 'ocr-row small', for: 'ocrKeep' }, keep, 'Aggiungi anche la foto del documento alle foto della constatazione'));
  box.append(h('details', { class: 'small' }, h('summary', {}, 'Testo letto'), h('pre', { class: 'ocr-raw' }, raw || '(vuoto)')));
  box.append(h('div', { class: 'btn-row' },
    rows.length && h('button', {
      class: 'primary', onclick: () => {
        let n = 0;
        rows.forEach(r => {
          if (!r.cb.checked || !r.inp.value) return;
          let v = r.inp.value;
          if (/targa|codiceFiscale|patente$/.test(r.path)) v = v.toUpperCase().replace(/\s/g, '');
          setPath(S, `${X}.${r.path}`, v); n++;
        });
        if (photo && keep.checked) S.photos.push({ data: photo, caption: (kind === 'patente' ? 'Patente ' : kind === 'assic' ? 'Assicurazione ' : 'Libretto ') + X, t: Date.now() });
        save(); closeModal(); render(); toast(`${n} campi inseriti nel veicolo ${X}`);
      },
    }, 'Inserisci i dati selezionati'),
    h('button', { class: 'secondary', onclick: () => { closeModal(); } }, 'Annulla')));
  modal(box);
}
