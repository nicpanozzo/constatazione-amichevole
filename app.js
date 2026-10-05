/* Constatazione Amichevole – app statica, nessun server: i dati restano sul dispositivo. */
'use strict';

/* ---------- Definizioni ---------- */

const CIRCOSTANZE = [
  'in fermata / in sosta',
  'ripartiva dopo una sosta / apriva una portiera',
  'stava parcheggiando',
  'usciva da un parcheggio, da un luogo privato, da una strada vicinale',
  'entrava in un parcheggio, in un luogo privato, in una strada vicinale',
  'si immetteva in una piazza a senso rotatorio',
  'circolava su una piazza a senso rotatorio',
  'tamponava procedendo nello stesso senso e nella stessa fila',
  'procedeva nello stesso senso ma in una fila diversa',
  'cambiava fila',
  'sorpassava',
  'girava a destra',
  'girava a sinistra',
  'retrocedeva',
  'invadeva la sede stradale riservata alla circolazione in senso inverso',
  'proveniva da destra (in un incrocio)',
  'non aveva osservato il segnale di precedenza o di semaforo rosso',
];

// Stessa numerazione del modulo europeo: utile con un conducente straniero.
const CIRCOSTANZE_EN = [
  'parked / stopped',
  'leaving a parking place / opening a door',
  'entering a parking place',
  'emerging from a car park, from private grounds, from a track',
  'entering a car park, private grounds, a track',
  'entering a roundabout',
  'circulating in a roundabout',
  'striking the rear of the other vehicle while going in the same direction and in the same lane',
  'going in the same direction but in a different lane',
  'changing lanes',
  'overtaking',
  'turning to the right',
  'turning to the left',
  'reversing',
  'encroaching on a lane reserved for traffic in the opposite direction',
  'coming from the right (at a junction)',
  'had not observed a right-of-way sign or a red light',
];

const PHOTO_SHOTS = [
  'Targa A', 'Targa B', 'Danni veicolo A', 'Danni veicolo B', 'Veicolo A intero', 'Veicolo B intero',
  'Posizione dei veicoli', 'Segnaletica / incrocio', 'Documenti A', 'Documenti B',
];

const ZONE = [
  // id, etichetta, x, y, w, h  (auto vista dall'alto, muso in alto)
  ['ant-sx', 'Anteriore sinistro', 20, 10, 50, 45],
  ['ant', 'Anteriore', 70, 10, 60, 45],
  ['ant-dx', 'Anteriore destro', 130, 10, 50, 45],
  ['lat-sx', 'Fiancata sinistra', 20, 55, 50, 150],
  ['tetto', 'Tetto / centro', 70, 55, 60, 150],
  ['lat-dx', 'Fiancata destra', 130, 55, 50, 150],
  ['post-sx', 'Posteriore sinistro', 20, 205, 50, 45],
  ['post', 'Posteriore', 70, 205, 60, 45],
  ['post-dx', 'Posteriore destro', 130, 205, 50, 45],
];

const SAFETY = [
  'Accendi le quattro frecce e, se possibile, sposta i veicoli in un punto sicuro.',
  'Indossa il giubbotto catarifrangente prima di scendere in strada.',
  'Posiziona il triangolo ad almeno 50 metri dietro il veicolo (100 m in autostrada).',
  'Controlla se qualcuno è ferito. Se sì chiama subito il 112 e non spostare i feriti.',
  'Se l\'altro conducente non collabora, è senza assicurazione o ci sono danni gravi, chiama le forze dell\'ordine (112).',
  'Scatta foto ai veicoli e alla scena prima di spostarli, se è sicuro farlo.',
];

const PARTY_SECTIONS = [
  {
    key: 'contraente', title: 'Contraente / Assicurato',
    hint: 'La persona intestataria della polizza (vedi certificato assicurativo).',
    fields: [
      ['cognome', 'Cognome'], ['nome', 'Nome'],
      ['codiceFiscale', 'Codice fiscale / P. IVA'],
      ['indirizzo', 'Indirizzo', 'text', 'full'],
      ['cap', 'CAP'], ['comune', 'Comune'], ['stato', 'Stato'],
      ['tel', 'Telefono', 'tel'], ['email', 'E-mail', 'email'],
    ],
  },
  {
    key: 'veicolo', title: 'Veicolo',
    fields: [
      ['tipo', 'Tipo', 'select:Autovettura|Motociclo|Ciclomotore|Autocarro|Furgone|Altro'],
      ['marca', 'Marca e modello'],
      ['targa', 'Targa'], ['statoImm', 'Stato di immatricolazione'],
      ['rimorchioTarga', 'Rimorchio: targa (se presente)'], ['rimorchioStato', 'Rimorchio: stato immatricolazione'],
    ],
  },
  {
    key: 'assic', title: 'Impresa di assicurazione',
    hint: 'I dati sono sul certificato di assicurazione o sull\'app della compagnia.',
    fields: [
      ['compagnia', 'Compagnia'], ['polizza', 'Numero di polizza'],
      ['cartaVerde', 'N. carta verde (veicoli esteri)'],
      ['validaDal', 'Valida dal', 'date'], ['validaAl', 'Valida al', 'date'],
      ['agenzia', 'Agenzia (o ufficio, o broker)'],
      ['agenziaIndirizzo', 'Indirizzo agenzia'], ['agenziaTel', 'Telefono / e-mail agenzia'],
      ['danniPropri', 'I danni materiali al veicolo sono coperti dal contratto?', 'yn', 'full'],
    ],
  },
  {
    key: 'conducente', title: 'Conducente',
    hint: 'Chi guidava al momento dell\'incidente (può essere diverso dal contraente).',
    copyFrom: 'contraente',
    fields: [
      ['cognome', 'Cognome'], ['nome', 'Nome'],
      ['nascita', 'Data di nascita', 'date'], ['codiceFiscale', 'Codice fiscale'],
      ['indirizzo', 'Indirizzo', 'text', 'full'], ['stato', 'Stato'],
      ['tel', 'Telefono', 'tel'], ['email', 'E-mail', 'email'],
      ['patente', 'Patente n.'], ['categoria', 'Categoria (A, B, …)'],
      ['patenteScad', 'Patente valida fino al', 'date'],
    ],
  },
];

const STEPS = [
  { id: 'sicurezza', label: 'Sicurezza' },
  { id: 'incidente', label: 'Incidente' },
  { id: 'A', label: 'Veicolo A' },
  { id: 'B', label: 'Veicolo B' },
  { id: 'circostanze', label: 'Circostanze' },
  { id: 'urto', label: 'Urto e danni' },
  { id: 'schizzo', label: 'Schizzo' },
  { id: 'foto', label: 'Foto' },
  { id: 'firme', label: 'Note e firme' },
  { id: 'riepilogo', label: 'Riepilogo / PDF' },
];

/* ---------- Stato e salvataggio ---------- */

function emptyParty() {
  const p = {};
  PARTY_SECTIONS.forEach(s => { p[s.key] = {}; });
  p.urto = []; p.danni = ''; p.circ = []; p.osservazioni = '';
  return p;
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function emptyState() {
  return {
    v: 1, id: newId(), step: 0, safety: [],
    incidente: { paese: 'Italia' },
    A: emptyParty(), B: emptyParty(),
    sketch: [], photos: [], firme: { A: '', B: '' },
  };
}

const DB = (() => {
  let dbp = null;
  function open() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open('cai', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('kv', mode);
      const req = fn(t.objectStore('kv'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    get: k => tx('readonly', s => s.get(k)).catch(() => null),
    set: (k, v) => tx('readwrite', s => s.put(v, k)).catch(e => console.warn('save failed', e)),
  };
})();

let S = emptyState();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => DB.set('state', S), 300);
}
function saveNow() { clearTimeout(saveTimer); return DB.set('state', S); }

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }

/* ---------- Utilità ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const app = $('#app');

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split('.'); const last = ks.pop();
  const tgt = ks.reduce((o, k) => (o[k] ??= {}), obj);
  tgt[last] = val;
}

function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
}

function modal(content) {
  const body = $('#modalBody'); body.innerHTML = '';
  body.append(content);
  $('#modal').hidden = false;
}
function closeModal() { $('#modal').hidden = true; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.hasAttribute('data-close')) closeModal(); });

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/* Campo legato allo stato tramite un percorso "A.veicolo.targa" */
function field(path, label, type = 'text', cls = '', root = null) {
  const id = 'f_' + path.replace(/\./g, '_');
  const tgt = () => root || S;
  const commit = v => { setPath(tgt(), path, v); if (!root) save(); };
  const val = getPath(tgt(), path) ?? '';
  const wrap = h('div', { class: 'field ' + (cls || '') });
  if (type === 'yn') {
    wrap.append(h('label', {}, label));
    const g = h('div', { class: 'yn', role: 'radiogroup' });
    [['si', 'Sì'], ['no', 'No']].forEach(([v, t]) => {
      g.append(h('label', {}, h('input', {
        type: 'radio', name: id, value: v, checked: val === v,
        onchange: () => commit(v),
      }), t));
    });
    wrap.append(g);
    return wrap;
  }
  let input;
  if (type.startsWith('select:')) {
    input = h('select', { id }, h('option', { value: '' }, '—'),
      type.slice(7).split('|').map(o => h('option', { value: o, selected: val === o }, o)));
  } else if (type === 'textarea') {
    input = h('textarea', { id }); input.value = val;
  } else {
    input = h('input', { id, type, value: val, autocomplete: 'off' });
    if (/targa|polizza|patente|codiceFiscale/.test(path)) input.setAttribute('autocapitalize', 'characters');
  }
  input.addEventListener('input', () => {
    let v = input.value;
    if (/\.targa$|rimorchioTarga$|codiceFiscale$/.test(path)) v = v.toUpperCase();
    commit(v);
  });
  wrap.append(h('label', { for: id }, label), input);
  return wrap;
}

/* ---------- Navigazione ---------- */

function renderStepper() {
  const ol = $('#stepper'); ol.innerHTML = '';
  STEPS.forEach((s, i) => {
    const b = h('button', {
      class: i === S.step ? 'active' : (stepDone(s.id) ? 'done' : ''),
      onclick: () => go(i),
    }, `${i + 1}. ${s.label}`);
    ol.append(h('li', {}, b));
  });
  const act = ol.querySelector('.active');
  if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#progressBar').style.width = `${(S.step / (STEPS.length - 1)) * 100}%`;
  $('#prevBtn').disabled = S.step === 0;
  $('#nextBtn').textContent = S.step === STEPS.length - 1 ? '🖨️ Stampa / PDF' : 'Avanti →';
  $('#stepLabel').textContent = `${S.step + 1} di ${STEPS.length}`;
}

function stepDone(id) {
  switch (id) {
    case 'sicurezza': return S.safety.length >= SAFETY.length;
    case 'incidente': return !!(S.incidente.data && S.incidente.luogo);
    case 'A': case 'B': return !!(S[id].veicolo.targa && S[id].assic.compagnia && S[id].conducente.cognome);
    case 'circostanze': return S.A.circ.length + S.B.circ.length > 0;
    case 'urto': return S.A.urto.length + S.B.urto.length > 0;
    case 'schizzo': return S.sketch.length > 0;
    case 'foto': return S.photos.length > 0;
    case 'firme': return !!(S.firme.A && S.firme.B);
    default: return false;
  }
}

function go(i) {
  if (i < 0 || i >= STEPS.length) return;
  S.step = i; save();
  render();
  window.scrollTo({ top: 0 });
}

$('#prevBtn').addEventListener('click', () => go(S.step - 1));
$('#nextBtn').addEventListener('click', () => {
  if (S.step === STEPS.length - 1) window.print();
  else go(S.step + 1);
});

function render() {
  renderStepper();
  app.innerHTML = '';
  const id = STEPS[S.step].id;
  const view = {
    sicurezza: viewSafety, incidente: viewIncidente, A: () => viewParty('A'), B: () => viewParty('B'),
    circostanze: viewCirc, urto: viewUrto, schizzo: viewSketch, foto: viewFoto, firme: viewFirme, riepilogo: viewRiepilogo,
  }[id];
  app.append(view());
}

/* ---------- Passo 1: sicurezza ---------- */

function viewSafety() {
  const f = document.createDocumentFragment();
  f.append(
    h('h1', {}, 'Prima di tutto: sicurezza'),
    h('p', { class: 'lead' }, 'Questa guida ti aiuta a compilare la constatazione amichevole (modulo CAI) insieme all\'altro conducente. I dati restano solo sul tuo telefono.'),
    h('div', { class: 'card alert' },
      h('strong', {}, '🚑 Feriti? Chiama subito il 112.'),
      h('div', { class: 'btn-row' }, h('a', { class: 'danger-btn', href: 'tel:112', style: 'text-decoration:none' }, '📞 Chiama 112')),
    ),
  );
  const ul = h('ul', { class: 'checklist' });
  SAFETY.forEach((t, i) => {
    const id = 'saf' + i;
    ul.append(h('li', {},
      h('input', {
        type: 'checkbox', id, checked: S.safety.includes(i),
        onchange: e => {
          S.safety = e.target.checked ? [...new Set([...S.safety, i])] : S.safety.filter(x => x !== i);
          save(); renderStepper();
        },
      }),
      h('label', { for: id }, t)));
  });
  f.append(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Checklist'), ul));
  f.append(h('div', { class: 'card' },
    h('h3', { style: 'margin-top:0' }, 'Come funziona'),
    h('ol', { style: 'margin:0;padding-left:20px' },
      h('li', {}, 'Decidete chi è il veicolo A e chi il veicolo B (non ha importanza).'),
      h('li', {}, 'Inserite i dati: ognuno può compilare i propri sul suo telefono e passarli all\'altro con un QR code.'),
      h('li', {}, 'Segnate insieme circostanze, punti d\'urto, schizzo e foto.'),
      h('li', {}, 'Firmate entrambi sul telefono e salvate il riepilogo in PDF.'),
      h('li', {}, 'Ricopiate i dati sul modulo CAI cartaceo (o allegate il PDF) e inviatelo alla vostra assicurazione entro 3 giorni.'),
    )));
  const prof = lsGet('cai_profile');
  if (!prof) {
    f.append(h('div', { class: 'card' },
      h('strong', {}, '💡 Suggerimento: '),
      'puoi salvare in anticipo i tuoi dati (auto, assicurazione, patente) per non doverli riscrivere al momento dell\'incidente.',
      h('div', { class: 'btn-row' }, h('button', { class: 'secondary', onclick: openProfile }, 'Salva i miei dati'))));
  }
  return f;
}

/* ---------- Passo 2: incidente ---------- */

function viewIncidente() {
  if (!S.incidente.data) {
    const n = new Date();
    const pad = x => String(x).padStart(2, '0');
    S.incidente.data = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
    S.incidente.ora = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    save();
  }
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Dati dell\'incidente'), h('p', { class: 'lead' }, 'Sezioni 1-5 del modulo CAI.'));

  const geoBtn = h('button', { class: 'secondary', onclick: locate }, '📍 Usa la mia posizione');
  const geoInfo = h('span', { class: 'muted small', id: 'geoInfo' }, S.incidente.coords ? `Coordinate: ${S.incidente.coords}` : '');
  f.append(h('div', { class: 'card' },
    h('div', { class: 'grid two' },
      field('incidente.data', 'Data', 'date'),
      field('incidente.ora', 'Ora', 'time'),
      field('incidente.luogo', 'Luogo (via, numero civico, km)', 'text', 'full'),
      field('incidente.comune', 'Comune / Provincia'),
      field('incidente.paese', 'Paese'),
    ),
    h('div', { class: 'btn-row', style: 'align-items:center' }, geoBtn, geoInfo),
  ));
  f.append(h('div', { class: 'card' },
    h('div', { class: 'grid' },
      field('incidente.feriti', 'Ci sono feriti, anche lievi?', 'yn'),
      field('incidente.danniAltriVeicoli', 'Danni materiali ad altri veicoli oltre A e B?', 'yn'),
      field('incidente.danniOggetti', 'Danni materiali a oggetti diversi dai veicoli (pali, recinzioni…)?', 'yn'),
      field('incidente.testimoni', 'Testimoni: nomi, indirizzi, telefoni', 'textarea'),
    )));
  f.append(h('p', { class: 'muted small' }, 'Se ci sono feriti, la constatazione amichevole resta valida per i danni materiali, ma è necessario l\'intervento delle autorità.'));
  return f;

  function locate() {
    if (!navigator.geolocation) return toast('Geolocalizzazione non disponibile');
    geoBtn.disabled = true; geoBtn.textContent = '⏳ Ricerca posizione…';
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: la, longitude: lo } = pos.coords;
      S.incidente.coords = `${la.toFixed(6)}, ${lo.toFixed(6)}`;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${lo}&accept-language=it&zoom=18`);
        const j = await r.json();
        const a = j.address || {};
        const via = [a.road, a.house_number].filter(Boolean).join(' ');
        if (via) S.incidente.luogo = via;
        const com = a.city || a.town || a.village || a.municipality || '';
        const prov = a.county || a.state || '';
        if (com) S.incidente.comune = [com, prov].filter(Boolean).join(' (') + (prov ? ')' : '');
        if (a.country) S.incidente.paese = a.country;
      } catch { toast('Indirizzo non trovato: salvate solo le coordinate'); }
      if (!S.incidente.luogo) S.incidente.luogo = S.incidente.coords;
      save(); render();
    }, err => {
      geoBtn.disabled = false; geoBtn.textContent = '📍 Usa la mia posizione';
      toast('Posizione non disponibile: ' + err.message);
    }, { enableHighAccuracy: true, timeout: 15000 });
  }
}

/* ---------- Passi 3-4: veicoli ---------- */

function viewParty(X) {
  const other = X === 'A' ? 'B' : 'A';
  const f = document.createDocumentFragment();
  f.append(
    h('h1', {}, h('span', { class: 'badge ' + X }, X), ' Veicolo ' + X),
    h('p', { class: 'lead' }, 'Sezioni 6-9 del modulo CAI. Compila i campi o importali.'),
  );
  const prof = lsGet('cai_profile');
  f.append(h('div', { class: 'card v' + X },
    h('strong', {}, 'Compila più in fretta'),
    h('div', { class: 'btn-row' },
      prof && h('button', { class: 'secondary', onclick: () => { applyParty(X, prof); toast('Dati salvati inseriti'); render(); } }, '👤 Usa i miei dati salvati'),
      h('button', { class: 'secondary', onclick: () => showShareQR(X) }, '📤 Passa questi dati all\'altro telefono'),
      h('button', { class: 'secondary', onclick: () => showReceiveHelp(X) }, '📥 Ricevi dati dall\'altro conducente'),
    )));

  const warn = checks().filter(c => c.X === X);
  if (warn.length) f.append(h('div', { class: 'card alert' }, h('strong', {}, 'Da ricontrollare'), h('ul', { class: 'warn-list' }, warn.map(c => h('li', {}, c.msg)))));

  PARTY_SECTIONS.forEach(sec => {
    const card = h('div', { class: 'card v' + X }, h('h3', { style: 'margin-top:0' }, sec.title));
    if (sec.hint) card.append(h('p', { class: 'muted small', style: 'margin-top:0' }, sec.hint));
    if (sec.key === 'assic') {
      card.append(h('p', { class: 'small', style: 'margin-top:0' }, 'Non trovi i dati? Puoi verificare compagnia e copertura dalla targa sul ',
        h('a', { href: 'https://www.ilportaledellautomobilista.it/web/portale-automobilista/verifica-copertura-rc', target: '_blank', rel: 'noopener' }, 'Portale dell\'Automobilista'), '.'));
    }
    if (sec.copyFrom) {
      card.append(h('div', { class: 'btn-row', style: 'margin:0 0 10px' }, h('button', {
        class: 'secondary', onclick: () => {
          const src = S[X][sec.copyFrom];
          ['cognome', 'nome', 'indirizzo', 'stato', 'tel', 'email', 'codiceFiscale'].forEach(k => { if (src[k]) S[X][sec.key][k] = src[k]; });
          if (src.comune || src.cap) S[X][sec.key].indirizzo = [src.indirizzo, [src.cap, src.comune].filter(Boolean).join(' ')].filter(Boolean).join(', ');
          save(); render();
        },
      }, 'Il conducente è il contraente: copia i dati')));
    }
    const g = h('div', { class: 'grid two' });
    sec.fields.forEach(([k, label, type = 'text', cls]) => g.append(field(`${X}.${sec.key}.${k}`, label, type, cls)));
    card.append(g);
    f.append(card);
  });
  f.append(h('p', { class: 'muted small' }, `Poi continua con il veicolo ${other} o con le circostanze.`));
  return f;
}

function partyPayload(X) {
  const p = {};
  PARTY_SECTIONS.forEach(s => { p[s.key] = { ...S[X][s.key] }; });
  return p;
}
function applyParty(X, data) {
  PARTY_SECTIONS.forEach(s => {
    if (data && data[s.key]) {
      for (const [k, v] of Object.entries(data[s.key])) if (v) S[X][s.key][k] = v;
    }
  });
  save();
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function compact(o) {
  // rimuove campi vuoti per accorciare il QR
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') { const c = compact(v); if (Object.keys(c).length) out[k] = c; }
    else if (v) out[k] = v;
  }
  return out;
}

function shareURL(data) {
  const base = location.href.split('#')[0];
  return `${base}#dati=${b64urlEncode(JSON.stringify(compact(data)))}`;
}

function showShareQR(X, data) {
  data = data || partyPayload(X);
  if (!Object.keys(compact(data)).length) return toast('Compila prima almeno qualche campo');
  const url = shareURL(data);
  const box = h('div', { class: 'qr-box' });
  const content = h('div', {},
    h('h3', { style: 'margin-top:0' }, 'Fai inquadrare questo QR all\'altro conducente'),
    h('p', { class: 'muted small' }, 'L\'altro conducente lo inquadra con la fotocamera del telefono: il sito si apre e chiede in quale veicolo (A o B) inserire i dati.'),
    box,
    h('div', { class: 'btn-row' },
      navigator.share && h('button', { class: 'secondary', onclick: () => navigator.share({ title: 'Dati per la constatazione amichevole', url }).catch(() => {}) }, '📤 Invia link (WhatsApp, SMS…)'),
      h('button', { class: 'secondary', onclick: () => navigator.clipboard?.writeText(url).then(() => toast('Link copiato')) }, '📋 Copia link'),
    ));
  modal(content);
  try {
    const qr = qrcode(0, 'L');
    qr.addData(url); qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    box.firstElementChild.setAttribute('style', 'width:100%;max-width:300px;height:auto');
  } catch { box.replaceWith(h('p', { class: 'muted' }, 'Dati troppo lunghi per il QR: usa "Invia link".')); }
}

function showReceiveHelp(X) {
  modal(h('div', {},
    h('h3', { style: 'margin-top:0' }, `Ricevere i dati del veicolo ${X}`),
    h('ol', { style: 'padding-left:20px' },
      h('li', {}, 'L\'altro conducente apre questo stesso sito sul suo telefono.'),
      h('li', {}, 'Inserisce i suoi dati (o usa "I miei dati salvati") e preme "Passa questi dati all\'altro telefono".'),
      h('li', {}, 'Tu inquadri il QR con la fotocamera, oppure apri il link che ti invia.'),
      h('li', {}, `Scegli "Veicolo ${X}" quando il sito te lo chiede.`),
    ),
    h('p', { class: 'muted small' }, 'Il passaggio avviene direttamente tra i due telefoni: nessun dato viene caricato su server.'),
  ));
}

function handleIncomingHash() {
  const m = location.hash.match(/^#dati=([\w-]+)/);
  if (!m) return;
  let data;
  try { data = JSON.parse(b64urlDecode(m[1])); } catch { toast('Link non valido'); return; }
  history.replaceState(null, '', location.pathname + location.search);
  const who = [data.conducente?.nome, data.conducente?.cognome].filter(Boolean).join(' ') ||
    [data.contraente?.nome, data.contraente?.cognome].filter(Boolean).join(' ');
  const pick = X => { applyParty(X, data); closeModal(); S.step = STEPS.findIndex(s => s.id === X); save(); render(); toast(`Dati inseriti nel veicolo ${X}`); };
  modal(h('div', {},
    h('h3', { style: 'margin-top:0' }, '📥 Dati ricevuti'),
    h('p', {}, `${who || 'Conducente'}${data.veicolo?.targa ? ' · targa ' + data.veicolo.targa : ''}${data.assic?.compagnia ? ' · ' + data.assic.compagnia : ''}`),
    h('p', { class: 'muted small' }, 'In quale veicolo li inserisco?'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'primary', onclick: () => pick('A') }, 'Veicolo A'),
      h('button', { class: 'primary', onclick: () => pick('B') }, 'Veicolo B'),
      h('button', { class: 'secondary', onclick: () => { lsSet('cai_profile', data); closeModal(); toast('Salvati come "I miei dati"'); } }, 'Salva come miei dati'),
    )));
}

/* ---------- Profilo personale ---------- */

function openProfile() {
  const prof = lsGet('cai_profile') || {};
  const tmp = {};
  PARTY_SECTIONS.forEach(s => { tmp[s.key] = { ...(prof[s.key] || {}) }; });
  const wrap = h('div', {},
    h('h3', { style: 'margin-top:0' }, '👤 I miei dati salvati'),
    h('p', { class: 'muted small' }, 'Restano solo su questo dispositivo. Al momento dell\'incidente li inserisci con un tocco o li passi all\'altro conducente via QR.'));
  PARTY_SECTIONS.forEach(sec => {
    const g = h('div', { class: 'grid' });
    sec.fields.forEach(([k, label, type = 'text']) => g.append(field(`${sec.key}.${k}`, label, type, '', tmp)));
    wrap.append(h('h3', {}, sec.title), g);
  });
  const collect = () => tmp;
  wrap.append(h('div', { class: 'btn-row' },
    h('button', { class: 'primary', onclick: () => { lsSet('cai_profile', collect()); closeModal(); toast('Dati salvati'); render(); } }, 'Salva'),
    h('button', { class: 'secondary', onclick: () => showShareQR(null, collect()) }, '📤 Mostra QR'),
    prof && Object.keys(prof).length && h('button', { class: 'secondary', onclick: () => { localStorage.removeItem('cai_profile'); closeModal(); toast('Dati eliminati'); render(); } }, 'Elimina'),
  ));
  modal(wrap);
}

/* ---------- Passo 5: circostanze ---------- */

function viewCirc() {
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Circostanze'),
    h('p', { class: 'lead' }, 'Sezione 12: segnate solo le caselle utili a descrivere l\'incidente, per ciascun veicolo.'));
  const en = lsGet('cai_circ_en') === true;
  f.append(h('div', { class: 'btn-row', style: 'margin:0 0 4px' }, h('button', {
    class: 'secondary', onclick: () => { lsSet('cai_circ_en', !en); render(); },
  }, en ? '🇮🇹 Solo italiano' : '🇬🇧 Mostra anche in inglese (conducente straniero)')));
  const tA = h('td', { class: 'chk' }), tB = h('td', { class: 'chk' });
  const upd = () => { tA.textContent = S.A.circ.length; tB.textContent = S.B.circ.length; renderStepper(); };
  const tb = h('tbody');
  CIRCOSTANZE.forEach((t, i) => {
    const n = i + 1;
    const cb = X => h('td', { class: 'chk c' + X }, h('input', {
      type: 'checkbox', 'aria-label': `Veicolo ${X}: ${t}`, checked: S[X].circ.includes(n),
      onchange: e => {
        S[X].circ = e.target.checked ? [...new Set([...S[X].circ, n])].sort((a, b) => a - b) : S[X].circ.filter(x => x !== n);
        save(); upd();
      },
    }));
    tb.append(h('tr', {}, cb('A'), h('td', { class: 'n' }, n),
      h('td', {}, t, en && h('div', { class: 'small muted', lang: 'en' }, CIRCOSTANZE_EN[i])), cb('B')));
  });
  const table = h('table', { class: 'circ-table' },
    h('thead', {}, h('tr', {}, h('th', { class: 'cA' }, 'A'), h('th'), h('th', { style: 'text-align:left' }, 'Il veicolo…'), h('th', { class: 'cB' }, 'B'))),
    tb,
    h('tfoot', {}, h('tr', {}, tA, h('td'), h('td', {}, 'Numero di caselle segnate'), tB)));
  upd();
  f.append(h('div', { class: 'card' }, table));
  return f;
}

/* ---------- Passo 6: urto e danni ---------- */

function carSVG(X, interactive) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 280');
  svg.setAttribute('class', 'car-svg');
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  svg.append(el('rect', { class: 'body', x: 30, y: 15, width: 140, height: 230, rx: 34 }));
  svg.append(el('rect', { x: 48, y: 70, width: 104, height: 40, rx: 8, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .35 }));
  svg.append(el('rect', { x: 48, y: 180, width: 104, height: 30, rx: 8, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .35 }));
  const t = el('text', { x: 100, y: 8, 'text-anchor': 'middle' }); t.textContent = '▲ davanti'; svg.append(t);
  const t2 = el('text', { x: 100, y: 275, 'text-anchor': 'middle' }); t2.textContent = 'dietro'; svg.append(t2);
  ZONE.forEach(([id, label, x, y, w, hh]) => {
    const r = el('rect', { class: 'zone' + (S[X].urto.includes(id) ? ' on' : ''), x, y, width: w, height: hh, rx: 6 });
    const tt = el('title', {}); tt.textContent = label; r.append(tt);
    if (interactive) {
      r.setAttribute('tabindex', '0'); r.setAttribute('role', 'button'); r.setAttribute('aria-label', label);
      const tog = () => {
        S[X].urto = S[X].urto.includes(id) ? S[X].urto.filter(z => z !== id) : [...S[X].urto, id];
        r.classList.toggle('on'); save(); renderStepper();
        const lab = document.getElementById('urtoLab' + X); if (lab) lab.textContent = urtoText(X) || 'Tocca le zone colpite';
      };
      r.addEventListener('click', tog);
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
    }
    svg.append(r);
  });
  return svg;
}
function urtoText(X) { return ZONE.filter(z => S[X].urto.includes(z[0])).map(z => z[1]).join(', '); }

function viewUrto() {
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Punto d\'urto e danni'),
    h('p', { class: 'lead' }, 'Sezioni 10-11: tocca le zone del veicolo dove è avvenuto l\'urto iniziale e descrivi i danni visibili.'));
  const wrap = h('div', { class: 'impact-wrap' });
  ['A', 'B'].forEach(X => {
    wrap.append(h('div', { class: 'card v' + X },
      h('h3', { style: 'margin-top:0' }, h('span', { class: 'badge ' + X }, X), ` ${S[X].veicolo.marca || 'Veicolo ' + X} ${S[X].veicolo.targa || ''}`),
      carSVG(X, true),
      h('p', { class: 'small muted', id: 'urtoLab' + X, style: 'text-align:center' }, urtoText(X) || 'Tocca le zone colpite'),
      field(`${X}.danni`, 'Danni visibili al veicolo', 'textarea'),
    ));
  });
  f.append(wrap);
  return f;
}

/* ---------- Disegno (schizzo e firme) ---------- */

function drawPad(canvas, getStrokes, onChange, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let cur = null;
  const tool = opts.tool || (() => ({ mode: 'pen', color: '#111', width: 4 }));

  function arrow(c, s) {
    const [x1, y1] = s.pts[0], [x2, y2] = s.pts[s.pts.length - 1];
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1), L = 10 + s.width * 3;
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - L * Math.cos(a - 0.45), y2 - L * Math.sin(a - 0.45));
    c.lineTo(x2 - L * Math.cos(a + 0.45), y2 - L * Math.sin(a + 0.45));
    c.closePath(); c.fill();
  }
  function paint(c = ctx) {
    c.save(); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore();
    if (opts.background) opts.background(c, W, H);
    const all = cur ? [...getStrokes(), cur] : getStrokes();
    for (const s of all) {
      c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.width; c.lineCap = 'round'; c.lineJoin = 'round';
      if (s.mode === 'text') {
        c.font = `bold ${s.size || 40}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 6; c.strokeStyle = '#fff'; c.strokeText(s.text, s.pts[0][0], s.pts[0][1]);
        c.fillText(s.text, s.pts[0][0], s.pts[0][1]);
      } else if (s.mode === 'arrow') {
        if (s.pts.length > 1) arrow(c, s);
      } else if (s.mode === 'rect') {
        const [x1, y1] = s.pts[0], [x2, y2] = s.pts[s.pts.length - 1];
        c.globalAlpha = .25; c.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)); c.globalAlpha = 1;
        c.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      } else {
        c.beginPath();
        s.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        if (s.pts.length === 1) c.lineTo(s.pts[0][0] + .1, s.pts[0][1]);
        c.stroke();
      }
    }
  }
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return [Math.round((e.clientX - r.left) * W / r.width), Math.round((e.clientY - r.top) * H / r.height)];
  };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const t = tool();
    if (t.mode === 'text') {
      getStrokes().push({ mode: 'text', text: t.text, color: t.color, size: t.size, pts: [pos(e)] });
      paint(); onChange(); return;
    }
    canvas.setPointerCapture(e.pointerId);
    cur = { ...t, pts: [pos(e)] };
    paint();
  });
  canvas.addEventListener('pointermove', e => {
    if (!cur) return;
    e.preventDefault();
    const p = pos(e);
    if (cur.mode === 'pen') cur.pts.push(p); else cur.pts[1] = p;
    paint();
  });
  const end = () => {
    if (!cur) return;
    if (cur.mode === 'pen' || cur.pts.length > 1) getStrokes().push(cur);
    cur = null; paint(); onChange();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  paint();
  return { paint, toDataURL: () => { paint(); return canvas.toDataURL('image/png'); } };
}

function viewSketch() {
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Grafico dell\'incidente'),
    h('p', { class: 'lead' }, 'Sezione 13: disegna le strade, la posizione dei veicoli A e B al momento dell\'urto, la direzione di marcia (frecce) e i segnali stradali.'));
  const COLORS = [['#111111', 'Strada / nero'], ['#2563eb', 'Veicolo A'], ['#ca8a04', 'Veicolo B'], ['#dc2626', 'Urto']];
  const T = { mode: 'pen', color: '#111111', width: 4, text: 'A', size: 40 };
  const canvas = h('canvas', { width: 1000, height: 700, 'aria-label': 'Area di disegno' });
  const tb = h('div', { class: 'toolbar' });
  const tb2 = h('div', { class: 'toolbar' });
  const btnState = () => {
    tb.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === T.mode && (T.mode !== 'text' || b.dataset.text === T.text)));
    tb2.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b.dataset.color === T.color));
  };
  [
    ['pen', '✏️ Mano libera'], ['arrow', '➜ Freccia'], ['rect', '▭ Veicolo'],
  ].forEach(([m, l]) => tb.append(h('button', { 'data-mode': m, onclick: () => { T.mode = m; btnState(); } }, l)));
  [['A', '#2563eb'], ['B', '#ca8a04'], ['STOP', '#dc2626'], ['✕', '#dc2626']].forEach(([txt, col]) =>
    tb.append(h('button', { 'data-mode': 'text', 'data-text': txt, onclick: () => { T.mode = 'text'; T.text = txt; T.color = col; T.size = txt === 'STOP' ? 28 : 44; btnState(); } }, `🔤 ${txt}`)));
  COLORS.forEach(([c, l]) => tb2.append(h('button', { 'data-color': c, onclick: () => { T.color = c; btnState(); } }, h('span', { class: 'swatch', style: `background:${c}` }), ' ', l)));
  tb2.append(
    h('button', { onclick: () => { T.width = T.width === 4 ? 14 : 4; toast(T.width === 4 ? 'Tratto sottile' : 'Tratto spesso (strade)'); } }, '↔ Spessore'),
    h('button', { onclick: () => { S.sketch.pop(); pad.paint(); save(); } }, '↶ Annulla'),
    h('button', { onclick: () => { if (confirm('Cancellare tutto il disegno?')) { S.sketch.length = 0; pad.paint(); save(); renderStepper(); } } }, '🗑️ Cancella'),
  );
  btnState();
  const pad = drawPad(canvas, () => S.sketch, () => { save(); renderStepper(); }, { tool: () => ({ ...T }) });
  f.append(h('div', { class: 'card' }, tb, tb2, h('div', { class: 'canvas-wrap' }, canvas),
    h('p', { class: 'muted small' }, 'Consiglio: usa "Spessore" per le strade, "▭ Veicolo" per i rettangoli delle auto, le etichette A/B e le frecce per la direzione di marcia.')));
  return f;
}

/* ---------- Passo 8: foto ---------- */

function resizeImage(file, max = 1400, q = 0.78) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

function viewFoto() {
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Foto'),
    h('p', { class: 'lead' }, 'Fotografa: entrambi i veicoli da più lati, le targhe, i danni da vicino, la scena con la posizione delle auto, i segnali stradali e i documenti (libretto, assicurazione, patente).'));
  const grid = h('div', { class: 'photos' });
  let draw = () => {
    grid.innerHTML = '';
    if (!S.photos.length) grid.append(h('p', { class: 'muted' }, 'Nessuna foto ancora.'));
    S.photos.forEach((p, i) => {
      const cap = h('input', { type: 'text', value: p.caption || '', placeholder: 'Descrizione' });
      cap.addEventListener('input', () => { p.caption = cap.value; save(); });
      grid.append(h('div', { class: 'photo' },
        h('img', { src: p.data, alt: p.caption || 'Foto ' + (i + 1), onclick: () => modal(h('img', { src: p.data, style: 'width:100%' })) }),
        h('button', { class: 'del', 'aria-label': 'Elimina foto', onclick: () => { if (confirm('Eliminare la foto?')) { S.photos.splice(i, 1); save(); draw(); renderStepper(); } } }, '✕'),
        cap));
    });
  };
  const add = async (files, tag) => {
    for (const file of files) {
      try {
        const data = await resizeImage(file);
        S.photos.push({ data, caption: tag || '', t: Date.now() });
      } catch { toast('Impossibile leggere una foto'); }
    }
    await saveNow(); draw(); renderStepper();
  };
  const cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true });
  const gal = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
  let tag = '';
  cam.addEventListener('change', () => { add([...cam.files], tag); cam.value = ''; });
  gal.addEventListener('change', () => { add([...gal.files], ''); gal.value = ''; });
  const shoot = t => { tag = t; cam.click(); };
  const shots = h('div', { class: 'shots' });
  const drawShots = () => {
    shots.innerHTML = '';
    PHOTO_SHOTS.forEach(t => {
      const done = S.photos.some(p => p.caption === t);
      shots.append(h('button', { class: 'shot' + (done ? ' done' : ''), onclick: () => shoot(t) }, done ? '✓ ' : '📷 ', t));
    });
  };
  const redraw = draw;
  draw = () => { redraw(); drawShots(); };
  f.append(h('div', { class: 'card' },
    h('h3', { style: 'margin-top:0' }, 'Foto consigliate'),
    h('p', { class: 'muted small', style: 'margin-top:0' }, 'Tocca una voce per scattare: la foto viene già descritta. Le voci con ✓ sono fatte.'),
    shots,
    h('div', { class: 'btn-row' },
      h('button', { class: 'primary', onclick: () => shoot('') }, '📷 Altra foto'),
      h('button', { class: 'secondary', onclick: () => gal.click() }, '🖼️ Dalla galleria'),
    ), cam, gal));
  f.append(h('div', { class: 'card' }, grid));
  draw();
  return f;
}

/* ---------- Passo 9: osservazioni e firme ---------- */

function viewFirme() {
  const f = document.createDocumentFragment();
  f.append(h('h1', {}, 'Osservazioni e firme'),
    h('p', { class: 'lead' }, 'Sezioni 14-15. Firmando, entrambi i conducenti confermano quanto riportato. Non è un\'ammissione di responsabilità: le responsabilità le valutano le assicurazioni.'));
  ['A', 'B'].forEach(X => {
    const canvas = h('canvas', { width: 800, height: 260, class: 'sig-canvas', 'aria-label': `Firma conducente ${X}` });
    const strokes = [];
    const pad = drawPad(canvas, () => strokes, () => { S.firme[X] = pad.toDataURL(); save(); renderStepper(); status.textContent = '✅ Firmato'; },
      { tool: () => ({ mode: 'pen', color: '#0b1a6b', width: 4 }) });
    const status = h('span', { class: 'small muted' }, S.firme[X] ? '✅ Firmato' : 'Firma con il dito qui sopra');
    if (S.firme[X]) {
      const img = new Image();
      img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
      img.src = S.firme[X];
    }
    const name = [S[X].conducente.nome, S[X].conducente.cognome].filter(Boolean).join(' ');
    f.append(h('div', { class: 'card v' + X },
      h('h3', { style: 'margin-top:0' }, h('span', { class: 'badge ' + X }, X), ` Conducente ${X}${name ? ': ' + name : ''}`),
      field(`${X}.osservazioni`, 'Osservazioni del conducente ' + X, 'textarea'),
      h('h4', { style: 'margin:12px 0 6px' }, 'Firma'),
      h('div', { class: 'canvas-wrap' }, canvas),
      h('div', { class: 'btn-row', style: 'align-items:center;justify-content:space-between' }, status,
        h('button', { class: 'secondary', onclick: () => { strokes.length = 0; S.firme[X] = ''; pad.paint(); save(); renderStepper(); status.textContent = 'Firma con il dito qui sopra'; } }, 'Cancella firma'))));
  });
  return f;
}

/* ---------- Passo 10: riepilogo ---------- */

function sketchDataURL() {
  if (!S.sketch.length) return '';
  const c = document.createElement('canvas'); c.width = 1000; c.height = 700;
  return drawPad(c, () => S.sketch, () => {}).toDataURL();
}

function kv(rows) {
  const dl = h('dl', { class: 'kv' });
  rows.forEach(([k, v]) => { if (v) dl.append(h('dt', {}, k), h('dd', {}, v)); });
  return dl.children.length ? dl : h('p', { class: 'muted small' }, '—');
}

function missing() {
  const m = [];
  if (!S.incidente.data) m.push('Data dell\'incidente');
  if (!S.incidente.luogo) m.push('Luogo dell\'incidente');
  ['A', 'B'].forEach(X => {
    const P = S[X];
    if (!P.veicolo.targa) m.push(`Targa veicolo ${X}`);
    if (!P.assic.compagnia) m.push(`Compagnia assicurativa ${X}`);
    if (!P.assic.polizza) m.push(`Numero di polizza ${X}`);
    if (!P.conducente.cognome) m.push(`Cognome conducente ${X}`);
    if (!P.conducente.patente) m.push(`Patente conducente ${X}`);
    if (!P.circ.length) m.push(`Circostanze veicolo ${X} (nessuna casella segnata)`);
    if (!S.firme[X]) m.push(`Firma conducente ${X}`);
  });
  return m;
}

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/* Controlli che non bloccano ma segnalano possibili errori */
function checks() {
  const out = [];
  const day = S.incidente.data;
  ['A', 'B'].forEach(X => {
    const P = S[X];
    const it = !P.veicolo.statoImm || /^ital/i.test(P.veicolo.statoImm);
    const t = (P.veicolo.targa || '').replace(/[\s-]/g, '');
    if (t && it && (P.veicolo.tipo || 'Autovettura') === 'Autovettura' && !/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(t))
      out.push({ X, msg: `Targa ${X} "${P.veicolo.targa}": formato insolito per un'auto italiana (es. AB123CD), ricontrolla.` });
    if (day && P.assic.validaAl && P.assic.validaAl < day)
      out.push({ X, msg: `Assicurazione ${X} scaduta il ${fmtDate(P.assic.validaAl)}, prima dell'incidente. In questo caso conviene chiamare le forze dell'ordine.` });
    if (day && P.assic.validaDal && P.assic.validaDal > day)
      out.push({ X, msg: `Assicurazione ${X} valida solo dal ${fmtDate(P.assic.validaDal)}, dopo l'incidente.` });
    if (day && P.conducente.patenteScad && P.conducente.patenteScad < day)
      out.push({ X, msg: `Patente del conducente ${X} scaduta il ${fmtDate(P.conducente.patenteScad)}.` });
  });
  if (S.A.veicolo.targa && S.A.veicolo.targa === S.B.veicolo.targa) out.push({ msg: 'I veicoli A e B hanno la stessa targa.' });
  return out;
}

function partySummary(X) {
  const P = S[X];
  const yn = v => (v === 'si' ? 'Sì' : v === 'no' ? 'No' : '');
  const fullName = o => [o.cognome, o.nome].filter(Boolean).join(' ');
  return h('div', { class: 'card sum v' + X },
    h('h3', { style: 'margin-top:0' }, h('span', { class: 'badge ' + X }, 'VEICOLO ' + X)),
    h('h4', {}, '6. Contraente / Assicurato'),
    kv([['Nome', fullName(P.contraente)], ['C.F. / P.IVA', P.contraente.codiceFiscale],
      ['Indirizzo', [P.contraente.indirizzo, [P.contraente.cap, P.contraente.comune].filter(Boolean).join(' '), P.contraente.stato].filter(Boolean).join(', ')],
      ['Tel. / e-mail', [P.contraente.tel, P.contraente.email].filter(Boolean).join(' · ')]]),
    h('h4', {}, '7. Veicolo'),
    kv([['Tipo', P.veicolo.tipo], ['Marca e modello', P.veicolo.marca], ['Targa', P.veicolo.targa], ['Stato immatr.', P.veicolo.statoImm],
      ['Rimorchio', [P.veicolo.rimorchioTarga, P.veicolo.rimorchioStato].filter(Boolean).join(' · ')]]),
    h('h4', {}, '8. Assicurazione'),
    kv([['Compagnia', P.assic.compagnia], ['Polizza n.', P.assic.polizza], ['Carta verde', P.assic.cartaVerde],
      ['Validità', [fmtDate(P.assic.validaDal), fmtDate(P.assic.validaAl)].filter(Boolean).join(' → ')],
      ['Agenzia', [P.assic.agenzia, P.assic.agenziaIndirizzo, P.assic.agenziaTel].filter(Boolean).join(' · ')],
      ['Danni propri coperti', yn(P.assic.danniPropri)]]),
    h('h4', {}, '9. Conducente'),
    kv([['Nome', fullName(P.conducente)], ['Nato/a il', fmtDate(P.conducente.nascita)], ['C.F.', P.conducente.codiceFiscale],
      ['Indirizzo', [P.conducente.indirizzo, P.conducente.stato].filter(Boolean).join(', ')],
      ['Tel. / e-mail', [P.conducente.tel, P.conducente.email].filter(Boolean).join(' · ')],
      ['Patente', [P.conducente.patente, P.conducente.categoria && 'cat. ' + P.conducente.categoria, P.conducente.patenteScad && 'valida fino al ' + fmtDate(P.conducente.patenteScad)].filter(Boolean).join(' · ')]]),
    h('h4', {}, '10. Punto d\'urto iniziale'),
    h('div', { style: 'display:flex;gap:10px;align-items:center' },
      h('div', { style: 'width:90px;flex:none' }, carSVG(X, false)),
      h('span', { class: 'small' }, urtoText(X) || '—')),
    h('h4', {}, '11. Danni visibili'),
    h('p', { class: 'small', style: 'margin:0;white-space:pre-wrap' }, P.danni || '—'),
    h('h4', {}, `12. Circostanze (${P.circ.length} caselle)`),
    P.circ.length ? h('ul', { class: 'small', style: 'margin:0;padding-left:18px' }, P.circ.map(n => h('li', {}, `${n}. ${CIRCOSTANZE[n - 1]}`))) : h('p', { class: 'small muted', style: 'margin:0' }, '—'),
    h('h4', {}, '14. Osservazioni'),
    h('p', { class: 'small', style: 'margin:0;white-space:pre-wrap' }, P.osservazioni || '—'),
    h('h4', {}, '15. Firma del conducente ' + X),
    S.firme[X] ? h('img', { class: 'sig-img', src: S.firme[X], alt: 'Firma ' + X }) : h('p', { class: 'small', style: 'color:var(--danger)' }, 'Non firmato'),
  );
}

function viewRiepilogo() {
  const f = document.createDocumentFragment();
  const I = S.incidente;
  const yn = v => (v === 'si' ? 'Sì' : v === 'no' ? 'No' : '');
  const miss = missing();

  f.append(h('div', { class: 'no-print' },
    h('h1', {}, 'Riepilogo'),
    h('p', { class: 'lead' }, 'Controllate insieme i dati, poi scaricate il PDF e passate la constatazione all\'altro conducente.'),
    miss.length ? h('div', { class: 'card alert' }, h('strong', {}, 'Mancano ancora:'), h('ul', { class: 'warn-list' }, miss.map(m => h('li', {}, m))))
      : h('div', { class: 'card', style: 'border-color:var(--ok)' }, '✅ Tutti i dati principali sono compilati.'),
    checks().length ? h('div', { class: 'card alert' }, h('strong', {}, 'Da ricontrollare:'), h('ul', { class: 'warn-list' }, checks().map(c => h('li', {}, c.msg)))) : null,
    h('div', { class: 'btn-row' },
      h('button', { class: 'primary', onclick: e => makePDF('download', e.currentTarget) }, '📄 Scarica PDF'),
      canShareFiles() && h('button', { class: 'primary', onclick: e => makePDF('share', e.currentTarget) }, '📤 Invia PDF (WhatsApp, e-mail…)'),
      h('button', { class: 'secondary', onclick: shareFull }, '📲 Passa tutto all\'altro conducente'),
      h('button', { class: 'secondary', onclick: () => window.print() }, '🖨️ Stampa'),
      navigator.share && h('button', { class: 'secondary', onclick: shareSummary }, '💬 Condividi come testo'),
    ),
    deadlineCard(),
  ));

  f.append(h('div', { class: 'print-only' },
    h('h1', { style: 'margin:0' }, 'Constatazione amichevole di incidente – riepilogo'),
    h('p', { class: 'small', style: 'margin:2px 0 8px' }, 'Documento di supporto alla Constatazione Amichevole di Incidente (CAI). Generato il ' + new Date().toLocaleString('it-IT'))));

  const mapLink = I.coords ? h('a', { href: `https://www.openstreetmap.org/?mlat=${I.coords.split(',')[0].trim()}&mlon=${I.coords.split(',')[1].trim()}#map=18/${I.coords.replace(/\s/g, '').replace(',', '/')}`, target: '_blank', rel: 'noopener' }, I.coords) : null;
  f.append(h('div', { class: 'card sum' },
    h('h3', { style: 'margin-top:0' }, 'Incidente'),
    h('div', { class: 'sum-grid' },
      kv([['1. Data e ora', [fmtDate(I.data), I.ora].filter(Boolean).join(' ore ')],
        ['2. Luogo', [I.luogo, I.comune, I.paese].filter(Boolean).join(', ')]]),
      h('div', {}, kv([['Coordinate GPS', I.coords || ''], ['3. Feriti anche lievi', yn(I.feriti)],
        ['4. Danni ad altri veicoli', yn(I.danniAltriVeicoli)], ['4. Danni ad altri oggetti', yn(I.danniOggetti)]]),
        mapLink && h('p', { class: 'small no-print', style: 'margin:4px 0 0' }, '🗺️ ', mapLink)),
    ),
    h('h4', {}, '5. Testimoni'),
    h('p', { class: 'small', style: 'margin:0;white-space:pre-wrap' }, I.testimoni || '—'),
  ));

  f.append(h('div', { class: 'sum-grid' }, partySummary('A'), partySummary('B')));

  const sk = sketchDataURL();
  f.append(h('div', { class: 'card sum', style: 'break-inside:avoid' },
    h('h3', { style: 'margin-top:0' }, '13. Grafico dell\'incidente'),
    sk ? h('img', { class: 'sum-img', src: sk, alt: 'Schizzo dell\'incidente' }) : h('p', { class: 'muted' }, 'Nessuno schizzo.')));

  if (S.photos.length) {
    f.append(h('div', { class: 'card sum page-break' },
      h('h3', { style: 'margin-top:0' }, `Foto (${S.photos.length})`),
      h('div', { class: 'sum-photos' }, S.photos.map((p, i) => h('figure', {},
        h('img', { src: p.data, alt: p.caption || '' }),
        h('figcaption', {}, `${i + 1}. ${p.caption || ''}`))))));
  }

  f.append(h('div', { class: 'card small muted' },
    h('strong', {}, 'Cosa fare adesso. '),
    'Il riepilogo firmato da entrambi aiuta a compilare il modulo CAI ufficiale (quello cartaceo fornito dalla compagnia o la versione digitale della tua assicurazione). ',
    'Denuncia il sinistro alla tua compagnia entro 3 giorni, allegando il modulo e questo PDF con le foto. ',
    'Il modulo firmato da entrambi i conducenti permette di accelerare la liquidazione del danno (procedura di risarcimento diretto). ',
    'Questo sito non è affiliato con ANIA né con alcuna compagnia assicurativa.'));
  return f;
}

function deadlineCard() {
  const d = S.incidente.data;
  if (!d) return null;
  const due = addDays(d, 3);
  return h('div', { class: 'card' },
    h('strong', {}, '⏰ Denuncia alla tua assicurazione entro il ' + fmtDate(due)),
    h('p', { class: 'small muted', style: 'margin:4px 0 0' }, 'Hai 3 giorni dall\'incidente. Invia il modulo CAI e il PDF con le foto alla tua compagnia o alla tua agenzia.'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'secondary', onclick: () => downloadICS(due) }, '📅 Aggiungi promemoria al calendario')));
}

function downloadICS(due) {
  const ymd = due.replace(/-/g, '');
  const targhe = ['A', 'B'].map(X => S[X].veicolo.targa).filter(Boolean).join(' / ');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Constatazione Amichevole//IT', 'BEGIN:VEVENT',
    `UID:${S.id}@constatazione-amichevole`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${addDays(due, 1).replace(/-/g, '')}`,
    `SUMMARY:Denuncia sinistro all'assicurazione${targhe ? ' (' + targhe + ')' : ''}`,
    `DESCRIPTION:Ultimo giorno per inviare la constatazione amichevole dell'incidente del ${fmtDate(S.incidente.data)}.`,
    'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Denuncia sinistro', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  downloadBlob(new Blob([ics], { type: 'text/calendar' }), 'promemoria-denuncia.ics');
}

function summaryText() {
  const I = S.incidente;
  const lines = [`CONSTATAZIONE AMICHEVOLE – ${fmtDate(I.data)} ${I.ora || ''}`, `Luogo: ${[I.luogo, I.comune, I.paese].filter(Boolean).join(', ')}${I.coords ? ' (' + I.coords + ')' : ''}`, ''];
  ['A', 'B'].forEach(X => {
    const P = S[X];
    lines.push(`VEICOLO ${X}: ${P.veicolo.marca || ''} targa ${P.veicolo.targa || '—'}`,
      `Assicurazione: ${P.assic.compagnia || '—'} polizza ${P.assic.polizza || '—'}`,
      `Conducente: ${[P.conducente.nome, P.conducente.cognome].filter(Boolean).join(' ') || '—'} tel ${P.conducente.tel || '—'}`,
      `Contraente: ${[P.contraente.nome, P.contraente.cognome].filter(Boolean).join(' ') || '—'}`,
      `Punto d'urto: ${urtoText(X) || '—'}`,
      `Circostanze: ${P.circ.join(', ') || '—'}`, '');
  });
  return lines.join('\n');
}
function shareSummary() { navigator.share({ title: 'Constatazione amichevole', text: summaryText() }).catch(() => {}); }

/* ---------- File, condivisione e archivio ---------- */

function downloadBlob(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function canShareFiles() {
  try { return !!navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] }); } catch { return false; }
}
async function shareOrDownload(blob, name, title) {
  const file = new File([blob], name, { type: blob.type });
  if (canShareFiles()) {
    try { await navigator.share({ files: [file], title }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  downloadBlob(blob, name);
}
function fileBase() {
  const t = ['A', 'B'].map(X => S[X].veicolo.targa).filter(Boolean).join('-');
  return `constatazione-${S.incidente.data || 'bozza'}${t ? '-' + t : ''}`.replace(/[^\w-]/g, '');
}

function exportJSON() {
  downloadBlob(new Blob([JSON.stringify(S)], { type: 'application/json' }), fileBase() + '.json');
}

/* Passa l'intera constatazione (con foto, schizzo e firme) all'altro telefono */
function shareFull() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  modal(h('div', {},
    h('h3', { style: 'margin-top:0' }, '📲 Passa tutto all\'altro conducente'),
    h('p', {}, 'Invia il file della constatazione (WhatsApp, e-mail, AirDrop, Bluetooth…). L\'altro conducente apre questo sito, menu ☰ → "Apri constatazione ricevuta" e sceglie il file: vedrà gli stessi dati, foto, schizzo e firme.'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'primary', onclick: () => shareOrDownload(blob, fileBase() + '.json', 'Constatazione amichevole') }, canShareFiles() ? '📤 Invia file' : '💾 Scarica file'))));
}

function hasData(st) {
  return !!(st && (st.A?.veicolo?.targa || st.B?.veicolo?.targa || st.incidente?.luogo || st.photos?.length || st.sketch?.length));
}
function stateTitle(st) {
  const t = ['A', 'B'].map(X => st[X]?.veicolo?.targa).filter(Boolean).join(' / ');
  return [fmtDate(st.incidente?.data), st.incidente?.comune || st.incidente?.luogo, t].filter(Boolean).join(' · ') || 'Bozza senza dati';
}
async function archiveList() { return (await DB.get('archive')) || []; }
async function archiveCurrent() {
  if (!hasData(S)) return;
  S.id ||= newId();
  const list = (await archiveList()).filter(x => x.id !== S.id);
  list.unshift({ id: S.id, title: stateTitle(S), savedAt: Date.now() });
  await DB.set('arch:' + S.id, JSON.parse(JSON.stringify(S)));
  await DB.set('archive', list);
}
function normalize(st) {
  const out = Object.assign(emptyState(), st);
  ['A', 'B'].forEach(X => { out[X] = Object.assign(emptyParty(), out[X]); PARTY_SECTIONS.forEach(s => { out[X][s.key] ||= {}; }); });
  out.incidente ||= {}; out.firme ||= { A: '', B: '' };
  return out;
}
async function loadState(st, msg) {
  await archiveCurrent();
  S = normalize(st); await saveNow(); render(); window.scrollTo({ top: 0 }); toast(msg);
}

async function openArchive() {
  const list = await archiveList();
  const box = h('div', {}, h('h3', { style: 'margin-top:0' }, '📚 Constatazioni salvate'));
  if (!list.length) box.append(h('p', { class: 'muted' }, 'Nessuna constatazione archiviata. Quando ne inizi una nuova, quella attuale viene salvata qui.'));
  list.forEach(item => {
    const cur = item.id === S.id;
    box.append(h('div', { class: 'arch-row' },
      h('div', {}, h('strong', {}, item.title), h('div', { class: 'small muted' }, (cur ? 'Aperta ora · ' : '') + 'salvata il ' + new Date(item.savedAt).toLocaleString('it-IT'))),
      h('div', { class: 'btn-row', style: 'margin:0' },
        !cur && h('button', { class: 'secondary', onclick: async () => { const st = await DB.get('arch:' + item.id); closeModal(); if (st) loadState(st, 'Constatazione riaperta'); } }, 'Apri'),
        h('button', { class: 'secondary', 'aria-label': 'Elimina', onclick: async e => {
          const b = e.currentTarget;
          if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Conferma eliminazione'; return; }
          await DB.set('archive', (await archiveList()).filter(x => x.id !== item.id)); await DB.set('arch:' + item.id, null);
          closeModal(); openArchive();
        } }, '🗑️'))));
  });
  modal(box);
}

/* ---------- Menu ---------- */

$('#menuBtn').addEventListener('click', () => { $('#menu').hidden = !$('#menu').hidden; });
$('#menu').addEventListener('click', async e => {
  const a = e.target.closest('[data-action]')?.dataset.action;
  if (!a) return;
  $('#menu').hidden = true;
  if (a === 'profile') openProfile();
  if (a === 'archive') openArchive();
  if (a === 'export') exportJSON();
  if (a === 'import') $('#importFile').click();
  if (a === 'new' && confirm('Iniziare una nuova constatazione? Quella attuale viene salvata nell\'archivio.')) {
    await archiveCurrent(); S = emptyState(); await saveNow(); render(); toast('Nuova constatazione');
  }
});
$('#importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.A || !data.B) throw new Error();
    await loadState(data, 'Constatazione aperta' + (hasData(S) ? ' (quella precedente è nell\'archivio)' : ''));
  } catch { toast('File non valido: serve un file .json creato da questo sito'); }
  e.target.value = '';
});

/* Tiene lo schermo acceso mentre si compila */
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); } catch { /* non supportato */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (!wakeLock || wakeLock.released)) keepAwake(); });

/* ---------- Avvio ---------- */

(async () => {
  const saved = await DB.get('state');
  if (saved && saved.A && saved.B) S = normalize(saved);
  if (!S.id) { S.id = newId(); save(); }
  keepAwake();
  render();
  handleIncomingHash();
  window.addEventListener('hashchange', handleIncomingHash);
  window.addEventListener('beforeprint', () => { if (STEPS[S.step].id !== 'riepilogo') go(STEPS.length - 1); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
