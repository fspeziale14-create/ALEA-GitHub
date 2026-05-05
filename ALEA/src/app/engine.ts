import { MODEL_WEIGHTS } from './modelWeights';
// ========== ALEA — Engine Previsionale v2 ==========
// ── COSTANTI MOTORE ────────────────────────────────────────────
export const DATA_PREN = new Date('2025-09-01T00:00:00');
export const FASCIA       = 25;
export const SOGLIA_PICCO = 12;
export const SOGLIA_PICCO_CUOCHI_PERC = 0.06;

export const ST_STOR_STATS: Record<string, any> = {"0_1":{"media_p":24.3,"std_p":44.4,"media_c":24.6,"std_c":12.6,"n":7},"0_2":{"media_p":5.0,"std_p":3.9,"media_c":18.8,"std_c":11.1,"n":8},"0_3":{"media_p":9.0,"std_p":4.7,"media_c":29.9,"std_c":11.0,"n":8},"0_4":{"media_p":29.5,"std_p":45.8,"media_c":32.2,"std_c":13.6,"n":4},"0_5":{"media_p":6.5,"std_p":5.7,"media_c":36.2,"std_c":21.5,"n":4},"0_6":{"media_p":31.6,"std_p":49.9,"media_c":57.0,"std_c":29.1,"n":5},"0_7":{"media_p":11.8,"std_p":3.4,"media_c":32.0,"std_c":14.5,"n":4},"0_8":{"media_p":20.5,"std_p":3.5,"media_c":44.8,"std_c":14.0,"n":4},"0_9":{"media_p":9.2,"std_p":8.0,"media_c":27.4,"std_c":21.6,"n":5},"0_10":{"media_p":6.2,"std_p":5.1,"media_c":16.2,"std_c":9.6,"n":4},"0_11":{"media_p":8.2,"std_p":6.2,"media_c":17.2,"std_c":13.4,"n":4},"0_12":{"media_p":16.0,"std_p":NaN,"media_c":11.0,"std_c":NaN,"n":1},"1_1":{"media_p":4.0,"std_p":3.1,"media_c":30.6,"std_c":11.7,"n":7},"1_2":{"media_p":7.8,"std_p":2.5,"media_c":36.8,"std_c":9.9,"n":8},"1_3":{"media_p":7.6,"std_p":4.9,"media_c":39.0,"std_c":16.0,"n":7},"1_4":{"media_p":8.4,"std_p":8.2,"media_c":43.0,"std_c":11.2,"n":5},"1_5":{"media_p":7.0,"std_p":1.4,"media_c":46.0,"std_c":21.1,"n":4},"1_6":{"media_p":12.2,"std_p":4.9,"media_c":53.2,"std_c":24.7,"n":4},"1_7":{"media_p":10.8,"std_p":4.4,"media_c":81.0,"std_c":18.1,"n":5},"1_8":{"media_p":20.8,"std_p":8.1,"media_c":75.5,"std_c":11.7,"n":4},"1_9":{"media_p":9.0,"std_p":11.0,"media_c":47.2,"std_c":21.8,"n":5},"1_10":{"media_p":2.8,"std_p":1.7,"media_c":32.2,"std_c":6.5,"n":4},"1_11":{"media_p":7.0,"std_p":3.3,"media_c":32.0,"std_c":18.5,"n":4},"1_12":{"media_p":0.0,"std_p":NaN,"media_c":30.0,"std_c":NaN,"n":1},"2_1":{"media_p":6.4,"std_p":5.5,"media_c":25.3,"std_c":11.2,"n":7},"2_2":{"media_p":7.8,"std_p":8.7,"media_c":25.8,"std_c":14.1,"n":8},"2_3":{"media_p":4.3,"std_p":2.4,"media_c":40.7,"std_c":36.0,"n":7},"2_4":{"media_p":5.4,"std_p":4.1,"media_c":26.2,"std_c":13.2,"n":5},"2_5":{"media_p":12.5,"std_p":6.8,"media_c":39.5,"std_c":23.8,"n":4},"2_6":{"media_p":4.8,"std_p":3.6,"media_c":59.2,"std_c":15.3,"n":4},"2_7":{"media_p":9.4,"std_p":5.1,"media_c":63.2,"std_c":11.5,"n":5},"2_8":{"media_p":28.0,"std_p":8.1,"media_c":46.2,"std_c":7.9,"n":4},"2_9":{"media_p":13.5,"std_p":6.5,"media_c":28.0,"std_c":5.7,"n":4},"2_10":{"media_p":2.2,"std_p":2.5,"media_c":25.0,"std_c":13.3,"n":5},"2_11":{"media_p":5.8,"std_p":5.2,"media_c":19.2,"std_c":8.9,"n":4},"2_12":{"media_p":4.5,"std_p":3.5,"media_c":31.5,"std_c":4.9,"n":2},"3_1":{"media_p":6.9,"std_p":3.3,"media_c":29.8,"std_c":15.5,"n":8},"3_2":{"media_p":10.4,"std_p":11.6,"media_c":33.0,"std_c":21.5,"n":8},"3_3":{"media_p":14.3,"std_p":18.1,"media_c":50.7,"std_c":33.7,"n":7},"3_4":{"media_p":26.0,"std_p":30.0,"media_c":42.0,"std_c":29.1,"n":4},"3_5":{"media_p":10.8,"std_p":9.5,"media_c":50.4,"std_c":28.9,"n":5},"3_6":{"media_p":8.8,"std_p":5.0,"media_c":57.0,"std_c":35.6,"n":4},"3_7":{"media_p":12.8,"std_p":6.2,"media_c":62.8,"std_c":10.9,"n":5},"3_8":{"media_p":24.2,"std_p":5.6,"media_c":55.8,"std_c":11.5,"n":4},"3_9":{"media_p":10.5,"std_p":3.7,"media_c":38.5,"std_c":9.3,"n":4},"3_10":{"media_p":4.6,"std_p":3.1,"media_c":16.6,"std_c":5.6,"n":5},"3_11":{"media_p":4.8,"std_p":3.8,"media_c":28.0,"std_c":19.3,"n":4},"3_12":{"media_p":1.0,"std_p":1.4,"media_c":53.5,"std_c":41.7,"n":2},"4_1":{"media_p":10.0,"std_p":5.1,"media_c":91.5,"std_c":22.4,"n":8},"4_2":{"media_p":26.4,"std_p":33.2,"media_c":121.4,"std_c":29.6,"n":8},"4_3":{"media_p":12.3,"std_p":16.4,"media_c":105.8,"std_c":12.4,"n":6},"4_4":{"media_p":25.8,"std_p":21.6,"media_c":75.5,"std_c":19.6,"n":4},"4_5":{"media_p":14.4,"std_p":12.9,"media_c":88.4,"std_c":40.5,"n":5},"4_6":{"media_p":9.8,"std_p":6.3,"media_c":120.5,"std_c":23.6,"n":4},"4_7":{"media_p":13.0,"std_p":11.6,"media_c":97.0,"std_c":24.3,"n":4},"4_8":{"media_p":43.2,"std_p":44.0,"media_c":95.8,"std_c":45.6,"n":5},"4_9":{"media_p":9.8,"std_p":6.3,"media_c":100.8,"std_c":13.1,"n":4},"4_10":{"media_p":26.2,"std_p":25.8,"media_c":88.4,"std_c":51.3,"n":5},"4_11":{"media_p":10.5,"std_p":6.0,"media_c":93.5,"std_c":16.0,"n":4},"4_12":{"media_p":3.5,"std_p":3.5,"media_c":97.5,"std_c":72.8,"n":2},"5_1":{"media_p":96.0,"std_p":25.1,"media_c":184.6,"std_c":27.2,"n":7},"5_2":{"media_p":84.0,"std_p":34.1,"media_c":184.1,"std_c":7.1,"n":8},"5_3":{"media_p":70.7,"std_p":36.1,"media_c":191.4,"std_c":28.1,"n":7},"5_4":{"media_p":39.0,"std_p":26.5,"media_c":144.2,"std_c":9.8,"n":4},"5_5":{"media_p":62.8,"std_p":21.5,"media_c":147.0,"std_c":44.2,"n":5},"5_6":{"media_p":79.2,"std_p":19.0,"media_c":155.2,"std_c":30.0,"n":4},"5_7":{"media_p":83.5,"std_p":38.8,"media_c":186.0,"std_c":24.1,"n":4},"5_8":{"media_p":63.2,"std_p":33.0,"media_c":93.0,"std_c":45.2,"n":5},"5_9":{"media_p":82.0,"std_p":9.5,"media_c":189.2,"std_c":12.0,"n":4},"5_10":{"media_p":60.8,"std_p":20.6,"media_c":177.8,"std_c":28.2,"n":4},"5_11":{"media_p":101.4,"std_p":52.0,"media_c":167.6,"std_c":36.9,"n":5},"5_12":{"media_p":64.0,"std_p":15.6,"media_c":151.5,"std_c":14.8,"n":2},"6_1":{"media_p":155.5,"std_p":28.1,"media_c":100.2,"std_c":56.9,"n":6},"6_2":{"media_p":133.9,"std_p":35.1,"media_c":68.5,"std_c":12.8,"n":8},"6_3":{"media_p":130.5,"std_p":39.6,"media_c":64.2,"std_c":18.1,"n":8},"6_4":{"media_p":98.2,"std_p":38.4,"media_c":76.2,"std_c":25.3,"n":4},"6_5":{"media_p":108.8,"std_p":25.4,"media_c":66.5,"std_c":16.9,"n":4},"6_6":{"media_p":109.2,"std_p":31.5,"media_c":101.6,"std_c":23.4,"n":5},"6_7":{"media_p":99.2,"std_p":42.2,"media_c":82.0,"std_c":33.5,"n":4},"6_8":{"media_p":49.6,"std_p":28.8,"media_c":58.8,"std_c":10.7,"n":5},"6_9":{"media_p":70.8,"std_p":12.4,"media_c":70.2,"std_c":17.6,"n":4},"6_10":{"media_p":83.2,"std_p":17.8,"media_c":40.5,"std_c":21.8,"n":4},"6_11":{"media_p":127.0,"std_p":23.9,"media_c":47.2,"std_c":12.8,"n":5},"6_12":{"media_p":113.5,"std_p":10.6,"media_c":42.5,"std_c":60.1,"n":2}};



// ========== ENGINE PREVISIONALE ALEA v2 ==========
// ================================================================
// ALEA — Engine Previsionale v2
// Fedele al motore_previsionale.py
//
// Il modello predice i WALK-IN (non i coperti totali).
// Coperti totali = pren_effettivi + walk-in previsti
//
// Feature critiche:
//   prc = flag sabato/domenica/festivo (de in [5,6])
//   crc = flag venerdì/sabato (de in [4,5])
//   wp7/wp14/wp21/wp28 = walk-in di N giorni fa (shift esatto, non media)
//   wps = wp7*0.40 + wp14*0.35 + wp21*0.15 + wp28*0.10
//   wp4 = (wp7+wp14+wp21+wp28)/4
//   zp  = (cp7 - mp) / sp   z-score rispetto media storica (de,mese)
//   pf_p/pnn_p/ns_p = prenotati lordi/netti/noshow, solo dopo DATA_PREN
// ================================================================

// ── TIPI ────────────────────────────────────────────────────────
export interface PrevisioneGiorno {
  data: string;
  pranzo: { lo: number; media: number; hi: number; walkin_lo: number; walkin_med: number; walkin_hi: number; };
  cena:   { lo: number; media: number; hi: number; walkin_lo: number; walkin_med: number; walkin_hi: number; };
}

export interface ConvocazioneResult {
  cam_fissi: number;
  cam_picco: number;   // usato dalla dashboard giornaliera
  cam_chiamata: number; // usato dalla pianificazione settimanale
  tipo: string;
  messaggio: string;
  nota: string;
  alternativa: string;
}


export interface CuochiResult {
  cuochi: number;
  messaggio: string;
  nota: string;
}

export interface CuochiSettimanaleResult {
  min: number;
  max: number;
  messaggio: string;
  nota: string;
}
export interface StoricoEntry {
  cp: number; cc: number;
  wp: number; wc: number;   // walk-in reali pranzo/cena
  lp: number; lc: number;   // prenotati lordi
  e: number;                // epoca (1 se >= DATA_PREN)
}

// ── ATTENDIBILITÀ FORECAST ───────────────────────────────────────
// 4 livelli: alta / buona / discreta / bassa
// Usa i 5 fattori concordati: storico n, CV, festività, prenotati vs media, range ampiezza

export interface AttendibilitaResult {
  livello: 'alta' | 'buona' | 'discreta' | 'bassa';
  motivazione: string;
  colore: string;       // classe Tailwind bg
  coloreBar: string;    // hex per style inline
}

export function calcolaAttendibilita(
  dateStr: string,
  stStor?: Record<string, any>,
  prenotati?: number   // prenotati correnti (opzionale, solo vista giornaliera)
): AttendibilitaResult {
  const _stor = stStor ?? ST_STOR_STATS;
  const d = new Date(dateStr + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // 0=lun...6=dom
  const mese = d.getMonth() + 1;
  const festivo = (() => {
    const day = d.getDate(); const month = d.getMonth() + 1; const year = d.getFullYear();
    const fisse = ['1-1','6-1','25-4','1-5','2-6','15-8','1-11','8-12','25-12','26-12'];
    if (fisse.includes(`${day}-${month}`)) return true;
    if (year === 2025 && month === 4 && day === 20) return true;
    if (year === 2026 && month === 4 && day === 5) return true;
    return false;
  })();
  const de = festivo
    ? ([0,1,2,3].includes(dow) ? 6 : dow === 4 ? 5 : dow)
    : dow;

  const key = `${de}_${mese}`;
  const s = _stor[key];

  // Se non c'è storico affatto → bassa
  if (!s) {
    return { livello: 'bassa', motivazione: 'Nessun dato storico per questo giorno', colore: 'bg-red-500', coloreBar: '#ef4444' };
  }

  const n: number = s.n ?? 0;
  const motivazioni: string[] = [];
  let penalita = 0; // 0=ok, 1=leggera, 2=media, 3=grave

  // Fattore 1 — Storico (peso principale)
  if (n < 3) {
    penalita += 3;
    motivazioni.push('storico molto limitato');
  } else if (n < 5) {
    penalita += 2;
    motivazioni.push('storico limitato per questo periodo');
  } else if (n < 8) {
    penalita += 1;
    motivazioni.push('storico discreto');
  }
  // n >= 8: nessuna penalità

  // Fattore 2 — Variabilità storica (CV = std/media su pranzo e cena)
  const cvP = (s.media_p > 0 && !isNaN(s.std_p)) ? s.std_p / s.media_p : 0;
  const cvC = (s.media_c > 0 && !isNaN(s.std_c)) ? s.std_c / s.media_c : 0;
  const cvMax = Math.max(cvP, cvC);
  if (cvMax > 0.8) {
    penalita += 2;
    motivazioni.push('variabilità storica molto alta');
  } else if (cvMax > 0.5) {
    penalita += 1;
    motivazioni.push('alta variabilità storica per questo giorno');
  }

  // Fattore 3 — Festività con storico corto
  const avviso = (() => {
    const day = d.getDate(); const month = d.getMonth() + 1; const year = d.getFullYear();
    if (year === 2026 && month === 4 && day === 5) return true;
    if (year === 2026 && month === 4 && day === 6) return true;
    if (month === 8 && day === 15) return true;
    if (month === 12 && (day === 25 || day === 26)) return true;
    return false;
  })();
  if (avviso) {
    penalita += 2;
    motivazioni.push('festività con storico insufficiente');
  }

  // Fattore 4 — Prenotati lontani dalla media (solo se passati)
  if (prenotati !== undefined && prenotati > 0) {
    const mediaCena = s.media_c ?? 0;
    const stdCena = s.std_c ?? 0;
    if (mediaCena > 0 && stdCena > 0 && !isNaN(stdCena)) {
      const zScore = Math.abs(prenotati - mediaCena) / stdCena;
      if (zScore > 1.5) {
        penalita += 1;
        motivazioni.push('prenotazioni fuori dalla norma per questo giorno');
      }
    }
  }

  // Fattore 5 — Ampiezza range (hi - lo) / media
  // Calcoliamo su pranzo e cena separatamente, prendiamo il peggio
  const rangeP = s.media_p > 0 ? (s.std_p * 1.4) / Math.max(s.media_p, 1) : 0;
  const rangeC = s.media_c > 0 ? (s.std_c * 1.4) / Math.max(s.media_c, 1) : 0;
  const rangeMax = Math.max(isNaN(rangeP) ? 0 : rangeP, isNaN(rangeC) ? 0 : rangeC);
  if (rangeMax > 1.5) {
    penalita += 1;
    motivazioni.push('range di previsione molto ampio');
  }

  // Calcola livello finale
  let livello: AttendibilitaResult['livello'];
  let colore: string;
  let coloreBar: string;
  if (penalita === 0) {
    livello = 'alta'; colore = 'bg-emerald-500'; coloreBar = '#22c55e';
  } else if (penalita <= 1) {
    livello = 'buona'; colore = 'bg-yellow-400'; coloreBar = '#facc15';
  } else if (penalita <= 3) {
    livello = 'discreta'; colore = 'bg-orange-400'; coloreBar = '#fb923c';
  } else {
    livello = 'bassa'; colore = 'bg-red-500'; coloreBar = '#ef4444';
  }

  // Prima motivazione più importante, o default positivo
  const motivazioneFin = motivazioni.length > 0
    ? motivazioni[0].charAt(0).toUpperCase() + motivazioni[0].slice(1)
    : 'Storico solido e variabilità contenuta';

  return { livello, motivazione: motivazioneFin, colore, coloreBar };
}

// ── ENGINE GBM (alberi flat) ─────────────────────────────────────
export function predictFlat(nodes: any[], idx: number, x: number[]): number {
  const n = nodes[idx];
  if (n.length === 1) return n[0];
  return predictFlat(nodes, x[n[0]] <= n[1] ? n[2] : n[3], x);
}

export function predictGBM(model: any, x: number[]): number {
  let p = model.init;
  for (const tree of model.trees) p += model.lr * predictFlat(tree, 0, x);
  return Math.max(0, p);
}

// ── LOGICA CUOCHI ────────────────────────────────────────────────
// Tolleranza ~6% vs 25% dei camerieri — un cuoco in meno blocca il servizio
// (costanti già dichiarate come export in cima al file)

export function fasciaCuochi(cop: number, ratio: number): number {
  if (cop <= 0) return 1;
  return Math.max(1, Math.ceil(cop / ratio));
}

interface CuochiResult {
  cuochi: number;
  messaggio: string;
  nota: string;
}

export function convocazioneCuochi(stima: number, rlo: number, rhi: number, ratio: number): CuochiResult {
  // Fascia sicurezza = ratio ideale × 1.15 (hardcoded)
  // Soglia +1 = 25% della fascia sicurezza
  const fasciaS = ratio * 1.15;
  const sogliaPlus = Math.floor(fasciaS * 0.25);
  const cuochi = fasciaCuochi(stima, fasciaS);
  const soglia = cuochi * fasciaS;
  const sforo = rhi - soglia;
  if (sforo <= 0) {
    return { cuochi, messaggio: `${cuochi} ${cuochi === 1 ? 'cuoco' : 'cuochi'}`, nota: '' };
  }
  if (sforo <= sogliaPlus) {
    return { cuochi, messaggio: `${cuochi} ${cuochi === 1 ? 'cuoco' : 'cuochi'}`, nota: '' };
  }
  // sforo > soglia: +1 diretto, niente picco
  const cuochi2 = cuochi + 1;
  return { cuochi: cuochi2, messaggio: `${cuochi2} ${cuochi2 === 1 ? 'cuoco' : 'cuochi'}`,
           nota: `Range ampio — si consiglia ${cuochi2} per sicurezza.` };
}

interface CuochiSettimanaleResult {
  min: number;
  max: number;
  messaggio: string;
  nota: string;
}

export function convocazioneCuochiSettimanale(stima: number, rlo: number, rhi: number, ratio: number): CuochiSettimanaleResult {
  const fasciaS = ratio * 1.15;
  const cuochiLo = fasciaCuochi(Math.max(stima, rlo), fasciaS);
  const cuochiHi = fasciaCuochi(rhi, fasciaS);
  const min = cuochiLo;
  const max = Math.min(cuochiHi, cuochiLo + 1);
  if (min === max) {
    return { min, max, messaggio: `${min} ${min === 1 ? 'cuoco' : 'cuochi'}`, nota: '' };
  }
  return { min, max, messaggio: `${min}–${max} ${max === 1 ? 'cuoco' : 'cuochi'}`, nota: 'Conferma con la previsione giornaliera.' };
}

// ── HELPERS ─────────────────────────────────────────────────────
export function dowEff(dow: number, festivo: boolean): number {
  // dow: 0=lun...6=dom (JS: 0=dom, quindi adattiamo)
  if (!festivo) return dow;
  if ([0,1,2,3].includes(dow)) return 6;
  if (dow === 4) return 5;
  return dow;
}

export function isFestivo(d: Date): boolean {
  const day = d.getDate(); const month = d.getMonth() + 1; const year = d.getFullYear();
  const fisse = ['1-1','6-1','25-4','1-5','2-6','15-8','1-11','8-12','25-12','26-12'];
  if (fisse.includes(`${day}-${month}`)) return true;
  // Pasqua 2025: 20 aprile, 2026: 5 aprile
  if (year === 2025 && month === 4 && day === 20) return true;
  if (year === 2026 && month === 4 && day === 5) return true;
  return false;
}

export function isPrefestivo(d: Date): boolean {
  const next = new Date(d); next.setDate(d.getDate() + 1);
  return isFestivo(next);
}

// Festività con storico insufficiente per previsione affidabile
// (viste 1 sola volta o comportamento molto diverso dalla norma)
export function getFestivitaAvviso(dateStr: string): string | null {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate(); const month = d.getMonth() + 1; const year = d.getFullYear();
  // Pasqua (1 sola osservazione, pattern molto variabile)
  if (year === 2026 && month === 4 && day === 5) return '🐣 Pasqua — storico corto (1 anno), previsione incerta. Aspetta i prenotati per pianificare con sicurezza.';
  if (year === 2026 && month === 4 && day === 6) return '🐣 Lunedì di Pasqua — storico corto (1 anno), previsione incerta. I prenotati saranno la guida più affidabile.';
  // Ferragosto (1 sola osservazione, estate 2025 potrebbe essere diversa)
  if (month === 8 && day === 15) return '🏖️ Ferragosto — storico corto (1 anno), comportamento estivo difficile da generalizzare. Affidati ai prenotati.';
  // Natale/Santo Stefano — il ristorante è probabilmente chiuso
  if (month === 12 && day === 25) return '🎄 Natale — verifica se il ristorante è aperto. Storico: chiuso nel 2025.';
  if (month === 12 && day === 26) return '🎄 Santo Stefano — verifica apertura. Storico: chiuso nel 2025.';
  return null;
}

export function getStorico(): Record<string, StoricoEntry> {
  // Storico base dal CSV
  const base: Record<string, StoricoEntry> = {"2024-12-30":{"cp":0.0,"cc":173.0,"wp":0,"wc":173.0,"lp":0.0,"lc":0.0,"e":0},"2024-12-31":{"cp":0.0,"cc":17.0,"wp":0,"wc":17.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-01":{"cp":25.0,"cc":39.0,"wp":25.0,"wc":39.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-02":{"cp":46.0,"cc":83.0,"wp":46.0,"wc":83.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-03":{"cp":62.0,"cc":73.0,"wp":62.0,"wc":73.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-04":{"cp":24.0,"cc":143.0,"wp":24.0,"wc":143.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-05":{"cp":62.0,"cc":117.0,"wp":62.0,"wc":117.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-06":{"cp":124.0,"cc":49.0,"wp":124.0,"wc":49.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-07":{"cp":0.0,"cc":17.0,"wp":0,"wc":17.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-08":{"cp":2.0,"cc":14.0,"wp":2.0,"wc":14.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-09":{"cp":10.0,"cc":29.0,"wp":10.0,"wc":29.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-10":{"cp":9.0,"cc":80.0,"wp":9.0,"wc":80.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-11":{"cp":91.0,"cc":235.0,"wp":91.0,"wc":235.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-12":{"cp":109.0,"cc":78.0,"wp":109.0,"wc":78.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-13":{"cp":2.0,"cc":22.0,"wp":2.0,"wc":22.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-14":{"cp":0.0,"cc":42.0,"wp":0,"wc":42.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-15":{"cp":8.0,"cc":25.0,"wp":8.0,"wc":25.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-16":{"cp":8.0,"cc":27.0,"wp":8.0,"wc":27.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-17":{"cp":8.0,"cc":107.0,"wp":8.0,"wc":107.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-18":{"cp":65.0,"cc":170.0,"wp":65.0,"wc":170.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-19":{"cp":185.0,"cc":84.0,"wp":185.0,"wc":84.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-20":{"cp":20.0,"cc":32.0,"wp":20.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-21":{"cp":7.0,"cc":12.0,"wp":7.0,"wc":12.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-22":{"cp":17.0,"cc":48.0,"wp":17.0,"wc":48.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-23":{"cp":2.0,"cc":16.0,"wp":2.0,"wc":16.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-24":{"cp":18.0,"cc":85.0,"wp":18.0,"wc":85.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-25":{"cp":106.0,"cc":175.0,"wp":106.0,"wc":175.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-26":{"cp":181.0,"cc":115.0,"wp":181.0,"wc":115.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-27":{"cp":7.0,"cc":18.0,"wp":7.0,"wc":18.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-28":{"cp":6.0,"cc":35.0,"wp":6.0,"wc":35.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-29":{"cp":2.0,"cc":17.0,"wp":2.0,"wc":17.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-30":{"cp":6.0,"cc":33.0,"wp":6.0,"wc":33.0,"lp":0.0,"lc":0.0,"e":0},"2025-01-31":{"cp":10.0,"cc":133.0,"wp":10.0,"wc":133.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-01":{"cp":92.0,"cc":193.0,"wp":92.0,"wc":193.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-02":{"cp":142.0,"cc":74.0,"wp":142.0,"wc":74.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-03":{"cp":2.0,"cc":2.0,"wp":2.0,"wc":2.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-04":{"cp":8.0,"cc":38.0,"wp":8.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-05":{"cp":2.0,"cc":32.0,"wp":2.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-06":{"cp":0.0,"cc":20.0,"wp":0,"wc":20.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-07":{"cp":0.0,"cc":106.0,"wp":0,"wc":106.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-08":{"cp":105.0,"cc":190.0,"wp":105.0,"wc":190.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-09":{"cp":177.0,"cc":71.0,"wp":177.0,"wc":71.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-10":{"cp":4.0,"cc":16.0,"wp":4.0,"wc":16.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-11":{"cp":6.0,"cc":32.0,"wp":6.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-12":{"cp":0.0,"cc":23.0,"wp":0,"wc":23.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-13":{"cp":7.0,"cc":28.0,"wp":7.0,"wc":28.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-14":{"cp":10.0,"cc":164.0,"wp":10.0,"wc":164.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-15":{"cp":63.0,"cc":177.0,"wp":63.0,"wc":177.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-16":{"cp":140.0,"cc":59.0,"wp":140.0,"wc":59.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-17":{"cp":11.0,"cc":28.0,"wp":11.0,"wc":28.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-18":{"cp":10.0,"cc":36.0,"wp":10.0,"wc":36.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-19":{"cp":25.0,"cc":35.0,"wp":25.0,"wc":35.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-20":{"cp":25.0,"cc":35.0,"wp":25.0,"wc":35.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-21":{"cp":12.0,"cc":102.0,"wp":12.0,"wc":102.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-22":{"cp":137.0,"cc":182.0,"wp":137.0,"wc":182.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-23":{"cp":161.0,"cc":59.0,"wp":161.0,"wc":59.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-24":{"cp":2.0,"cc":22.0,"wp":2.0,"wc":22.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-25":{"cp":8.0,"cc":23.0,"wp":8.0,"wc":23.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-26":{"cp":10.0,"cc":52.0,"wp":10.0,"wc":52.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-27":{"cp":0.0,"cc":15.0,"wp":0,"wc":15.0,"lp":0.0,"lc":0.0,"e":0},"2025-02-28":{"cp":1.0,"cc":102.0,"wp":1.0,"wc":102.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-01":{"cp":67.0,"cc":227.0,"wp":67.0,"wc":227.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-02":{"cp":126.0,"cc":50.0,"wp":126.0,"wc":50.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-03":{"cp":7.0,"cc":38.0,"wp":7.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-04":{"cp":8.0,"cc":27.0,"wp":8.0,"wc":27.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-05":{"cp":6.0,"cc":33.0,"wp":6.0,"wc":33.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-06":{"cp":3.0,"cc":25.0,"wp":3.0,"wc":25.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-07":{"cp":6.0,"cc":122.0,"wp":6.0,"wc":122.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-08":{"cp":25.0,"cc":176.0,"wp":25.0,"wc":176.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-09":{"cp":152.0,"cc":79.0,"wp":152.0,"wc":79.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-10":{"cp":3.0,"cc":25.0,"wp":3.0,"wc":25.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-11":{"cp":2.0,"cc":31.0,"wp":2.0,"wc":31.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-12":{"cp":7.0,"cc":29.0,"wp":7.0,"wc":29.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-13":{"cp":5.0,"cc":29.0,"wp":5.0,"wc":29.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-14":{"cp":10.0,"cc":104.0,"wp":10.0,"wc":104.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-15":{"cp":115.0,"cc":226.0,"wp":115.0,"wc":226.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-16":{"cp":125.0,"cc":58.0,"wp":125.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-17":{"cp":14.0,"cc":27.0,"wp":14.0,"wc":27.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-18":{"cp":14.0,"cc":33.0,"wp":14.0,"wc":33.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-19":{"cp":3.0,"cc":120.0,"wp":3.0,"wc":120.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-20":{"cp":6.0,"cc":42.0,"wp":6.0,"wc":42.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-21":{"cp":5.0,"cc":100.0,"wp":5.0,"wc":100.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-22":{"cp":115.0,"cc":201.0,"wp":115.0,"wc":201.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-23":{"cp":170.0,"cc":85.0,"wp":170.0,"wc":85.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-24":{"cp":3.0,"cc":17.0,"wp":3.0,"wc":17.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-25":{"cp":5.0,"cc":52.0,"wp":5.0,"wc":52.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-26":{"cp":0.0,"cc":28.0,"wp":0,"wc":28.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-27":{"cp":8.0,"cc":55.0,"wp":8.0,"wc":55.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-28":{"cp":8.0,"cc":118.0,"wp":8.0,"wc":118.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-29":{"cp":37.0,"cc":155.0,"wp":37.0,"wc":155.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-30":{"cp":58.0,"cc":31.0,"wp":58.0,"wc":31.0,"lp":0.0,"lc":0.0,"e":0},"2025-03-31":{"cp":12.0,"cc":33.0,"wp":12.0,"wc":33.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-01":{"cp":9.0,"cc":53.0,"wp":9.0,"wc":53.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-02":{"cp":2.0,"cc":30.0,"wp":2.0,"wc":30.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-03":{"cp":4.0,"cc":2.0,"wp":4.0,"wc":2.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-04":{"cp":7.0,"cc":57.0,"wp":7.0,"wc":57.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-05":{"cp":19.0,"cc":140.0,"wp":19.0,"wc":140.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-06":{"cp":90.0,"cc":103.0,"wp":90.0,"wc":103.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-07":{"cp":4.0,"cc":20.0,"wp":4.0,"wc":20.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-08":{"cp":3.0,"cc":41.0,"wp":3.0,"wc":41.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-09":{"cp":0.0,"cc":22.0,"wp":0,"wc":22.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-10":{"cp":11.0,"cc":40.0,"wp":11.0,"wc":40.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-11":{"cp":14.0,"cc":73.0,"wp":14.0,"wc":73.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-12":{"cp":28.0,"cc":159.0,"wp":28.0,"wc":159.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-13":{"cp":151.0,"cc":82.0,"wp":151.0,"wc":82.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-14":{"cp":12.0,"cc":43.0,"wp":12.0,"wc":43.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-15":{"cp":7.0,"cc":38.0,"wp":7.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-16":{"cp":8.0,"cc":6.0,"wp":8.0,"wc":6.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-17":{"cp":70.0,"cc":58.0,"wp":70.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-18":{"cp":56.0,"cc":103.0,"wp":56.0,"wc":103.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-19":{"cp":78.0,"cc":139.0,"wp":78.0,"wc":139.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-20":{"cp":93.0,"cc":42.0,"wp":93.0,"wc":42.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-21":{"cp":98.0,"cc":45.0,"wp":98.0,"wc":45.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-22":{"cp":22.0,"cc":55.0,"wp":22.0,"wc":55.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-23":{"cp":9.0,"cc":41.0,"wp":9.0,"wc":41.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-24":{"cp":19.0,"cc":68.0,"wp":19.0,"wc":68.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-25":{"cp":26.0,"cc":69.0,"wp":26.0,"wc":69.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-26":{"cp":31.0,"cc":139.0,"wp":31.0,"wc":139.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-27":{"cp":59.0,"cc":78.0,"wp":59.0,"wc":78.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-28":{"cp":4.0,"cc":21.0,"wp":4.0,"wc":21.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-29":{"cp":1.0,"cc":28.0,"wp":1.0,"wc":28.0,"lp":0.0,"lc":0.0,"e":0},"2025-04-30":{"cp":8.0,"cc":32.0,"wp":8.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-01":{"cp":27.0,"cc":97.0,"wp":27.0,"wc":97.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-02":{"cp":37.0,"cc":50.0,"wp":37.0,"wc":50.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-03":{"cp":52.0,"cc":127.0,"wp":52.0,"wc":127.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-04":{"cp":84.0,"cc":53.0,"wp":84.0,"wc":53.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-05":{"cp":6.0,"cc":21.0,"wp":6.0,"wc":21.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-06":{"cp":5.0,"cc":27.0,"wp":5.0,"wc":27.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-07":{"cp":11.0,"cc":36.0,"wp":11.0,"wc":36.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-08":{"cp":8.0,"cc":28.0,"wp":8.0,"wc":28.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-09":{"cp":9.0,"cc":56.0,"wp":9.0,"wc":56.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-10":{"cp":53.0,"cc":177.0,"wp":53.0,"wc":177.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-11":{"cp":143.0,"cc":88.0,"wp":143.0,"wc":88.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-12":{"cp":0.0,"cc":35.0,"wp":0,"wc":35.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-13":{"cp":8.0,"cc":76.0,"wp":8.0,"wc":76.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-14":{"cp":6.0,"cc":32.0,"wp":6.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-15":{"cp":2.0,"cc":25.0,"wp":2.0,"wc":25.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-16":{"cp":6.0,"cc":125.0,"wp":6.0,"wc":125.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-17":{"cp":75.0,"cc":152.0,"wp":75.0,"wc":152.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-18":{"cp":111.0,"cc":53.0,"wp":111.0,"wc":53.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-19":{"cp":14.0,"cc":22.0,"wp":14.0,"wc":22.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-20":{"cp":7.0,"cc":38.0,"wp":7.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-21":{"cp":11.0,"cc":73.0,"wp":11.0,"wc":73.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-22":{"cp":9.0,"cc":55.0,"wp":9.0,"wc":55.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-23":{"cp":7.0,"cc":73.0,"wp":7.0,"wc":73.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-24":{"cp":94.0,"cc":196.0,"wp":94.0,"wc":196.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-25":{"cp":97.0,"cc":72.0,"wp":97.0,"wc":72.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-26":{"cp":6.0,"cc":67.0,"wp":6.0,"wc":67.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-27":{"cp":8.0,"cc":43.0,"wp":8.0,"wc":43.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-28":{"cp":22.0,"cc":17.0,"wp":22.0,"wc":17.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-29":{"cp":8.0,"cc":47.0,"wp":8.0,"wc":47.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-30":{"cp":13.0,"cc":138.0,"wp":13.0,"wc":138.0,"lp":0.0,"lc":0.0,"e":0},"2025-05-31":{"cp":40.0,"cc":83.0,"wp":40.0,"wc":83.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-01":{"cp":74.0,"cc":138.0,"wp":74.0,"wc":138.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-02":{"cp":120.0,"cc":102.0,"wp":120.0,"wc":102.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-03":{"cp":15.0,"cc":32.0,"wp":15.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-04":{"cp":8.0,"cc":46.0,"wp":8.0,"wc":46.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-05":{"cp":8.0,"cc":26.0,"wp":8.0,"wc":26.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-06":{"cp":8.0,"cc":144.0,"wp":8.0,"wc":144.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-07":{"cp":72.0,"cc":183.0,"wp":72.0,"wc":183.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-08":{"cp":98.0,"cc":78.0,"wp":98.0,"wc":78.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-09":{"cp":2.0,"cc":58.0,"wp":2.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-10":{"cp":6.0,"cc":56.0,"wp":6.0,"wc":56.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-11":{"cp":4.0,"cc":58.0,"wp":4.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-12":{"cp":2.0,"cc":60.0,"wp":2.0,"wc":60.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-13":{"cp":2.0,"cc":135.0,"wp":2.0,"wc":135.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-14":{"cp":56.0,"cc":117.0,"wp":56.0,"wc":117.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-15":{"cp":148.0,"cc":110.0,"wp":148.0,"wc":110.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-16":{"cp":4.0,"cc":39.0,"wp":4.0,"wc":39.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-17":{"cp":17.0,"cc":87.0,"wp":17.0,"wc":87.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-18":{"cp":7.0,"cc":52.0,"wp":7.0,"wc":52.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-19":{"cp":12.0,"cc":36.0,"wp":12.0,"wc":36.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-20":{"cp":17.0,"cc":92.0,"wp":17.0,"wc":92.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-21":{"cp":91.0,"cc":175.0,"wp":91.0,"wc":175.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-22":{"cp":90.0,"cc":94.0,"wp":90.0,"wc":94.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-23":{"cp":15.0,"cc":61.0,"wp":15.0,"wc":61.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-24":{"cp":11.0,"cc":38.0,"wp":11.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-25":{"cp":0.0,"cc":81.0,"wp":0,"wc":81.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-26":{"cp":13.0,"cc":106.0,"wp":13.0,"wc":106.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-27":{"cp":12.0,"cc":111.0,"wp":12.0,"wc":111.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-28":{"cp":98.0,"cc":146.0,"wp":98.0,"wc":146.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-29":{"cp":136.0,"cc":88.0,"wp":136.0,"wc":88.0,"lp":0.0,"lc":0.0,"e":0},"2025-06-30":{"cp":17.0,"cc":25.0,"wp":17.0,"wc":25.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-01":{"cp":8.0,"cc":61.0,"wp":8.0,"wc":61.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-02":{"cp":7.0,"cc":63.0,"wp":7.0,"wc":63.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-03":{"cp":9.0,"cc":76.0,"wp":9.0,"wc":76.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-04":{"cp":6.0,"cc":124.0,"wp":6.0,"wc":124.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-05":{"cp":124.0,"cc":208.0,"wp":124.0,"wc":208.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-06":{"cp":162.0,"cc":100.0,"wp":162.0,"wc":100.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-07":{"cp":9.0,"cc":12.0,"wp":9.0,"wc":12.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-08":{"cp":5.0,"cc":73.0,"wp":5.0,"wc":73.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-09":{"cp":7.0,"cc":50.0,"wp":7.0,"wc":50.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-10":{"cp":7.0,"cc":68.0,"wp":7.0,"wc":68.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-11":{"cp":11.0,"cc":102.0,"wp":11.0,"wc":102.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-12":{"cp":40.0,"cc":171.0,"wp":40.0,"wc":171.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-13":{"cp":71.0,"cc":120.0,"wp":71.0,"wc":120.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-14":{"cp":9.0,"cc":38.0,"wp":9.0,"wc":38.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-15":{"cp":14.0,"cc":71.0,"wp":14.0,"wc":71.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-16":{"cp":18.0,"cc":77.0,"wp":18.0,"wc":77.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-17":{"cp":20.0,"cc":48.0,"wp":20.0,"wc":48.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-18":{"cp":5.0,"cc":97.0,"wp":5.0,"wc":97.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-19":{"cp":63.0,"cc":160.0,"wp":63.0,"wc":160.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-20":{"cp":82.0,"cc":58.0,"wp":82.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-21":{"cp":13.0,"cc":46.0,"wp":13.0,"wc":46.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-22":{"cp":11.0,"cc":103.0,"wp":11.0,"wc":103.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-23":{"cp":10.0,"cc":54.0,"wp":10.0,"wc":54.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-24":{"cp":9.0,"cc":66.0,"wp":9.0,"wc":66.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-25":{"cp":30.0,"cc":65.0,"wp":30.0,"wc":65.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-26":{"cp":107.0,"cc":205.0,"wp":107.0,"wc":205.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-27":{"cp":82.0,"cc":50.0,"wp":82.0,"wc":50.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-28":{"cp":16.0,"cc":32.0,"wp":16.0,"wc":32.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-29":{"cp":16.0,"cc":97.0,"wp":16.0,"wc":97.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-30":{"cp":5.0,"cc":72.0,"wp":5.0,"wc":72.0,"lp":0.0,"lc":0.0,"e":0},"2025-07-31":{"cp":19.0,"cc":56.0,"wp":19.0,"wc":56.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-01":{"cp":17.0,"cc":140.0,"wp":17.0,"wc":140.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-02":{"cp":109.0,"cc":124.0,"wp":109.0,"wc":124.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-03":{"cp":43.0,"cc":60.0,"wp":43.0,"wc":60.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-04":{"cp":18.0,"cc":65.0,"wp":18.0,"wc":65.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-05":{"cp":15.0,"cc":80.0,"wp":15.0,"wc":80.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-06":{"cp":22.0,"cc":44.0,"wp":22.0,"wc":44.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-07":{"cp":17.0,"cc":48.0,"wp":17.0,"wc":48.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-08":{"cp":14.0,"cc":52.0,"wp":14.0,"wc":52.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-09":{"cp":54.0,"cc":78.0,"wp":54.0,"wc":78.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-10":{"cp":25.0,"cc":77.0,"wp":25.0,"wc":77.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-11":{"cp":17.0,"cc":40.0,"wp":17.0,"wc":40.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-12":{"cp":30.0,"cc":67.0,"wp":30.0,"wc":67.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-13":{"cp":25.0,"cc":41.0,"wp":25.0,"wc":41.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-14":{"cp":27.0,"cc":70.0,"wp":27.0,"wc":70.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-15":{"cp":118.0,"cc":42.0,"wp":118.0,"wc":42.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-16":{"cp":35.0,"cc":47.0,"wp":35.0,"wc":47.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-17":{"cp":31.0,"cc":51.0,"wp":31.0,"wc":51.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-18":{"cp":24.0,"cc":41.0,"wp":24.0,"wc":41.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-19":{"cp":25.0,"cc":65.0,"wp":25.0,"wc":65.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-20":{"cp":40.0,"cc":58.0,"wp":40.0,"wc":58.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-21":{"cp":23.0,"cc":45.0,"wp":23.0,"wc":45.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-22":{"cp":19.0,"cc":130.0,"wp":19.0,"wc":130.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-23":{"cp":33.0,"cc":61.0,"wp":33.0,"wc":61.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-24":{"cp":97.8575,"cc":53.13,"wp":97.8575,"wc":53.13,"lp":0.0,"lc":0.0,"e":0},"2025-08-25":{"cp":23.0,"cc":33.0,"wp":23.0,"wc":33.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-26":{"cp":13.0,"cc":90.0,"wp":13.0,"wc":90.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-27":{"cp":25.0,"cc":42.0,"wp":25.0,"wc":42.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-28":{"cp":30.0,"cc":60.0,"wp":30.0,"wc":60.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-29":{"cp":48.0,"cc":115.0,"wp":48.0,"wc":115.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-30":{"cp":85.0,"cc":155.0,"wp":85.0,"wc":155.0,"lp":0.0,"lc":0.0,"e":0},"2025-08-31":{"cp":51.0,"cc":53.0,"wp":51.0,"wc":53.0,"lp":0.0,"lc":0.0,"e":0},"2025-09-01":{"cp":21.0,"cc":65.0,"wp":21.0,"wc":38.0,"lp":0.0,"lc":27.0,"e":1},"2025-09-02":{"cp":6.0,"cc":79.0,"wp":6.0,"wc":27.0,"lp":0.0,"lc":52.0,"e":1},"2025-09-03":{"cp":20.0,"cc":28.0,"wp":15.0,"wc":19.0,"lp":5.0,"lc":9.0,"e":1},"2025-09-04":{"cp":9.0,"cc":35.0,"wp":9.0,"wc":11.0,"lp":0.0,"lc":24.0,"e":1},"2025-09-05":{"cp":13.0,"cc":86.0,"wp":13.0,"wc":35.0,"lp":0.0,"lc":51.0,"e":1},"2025-09-06":{"cp":68.0,"cc":202.0,"wp":28.0,"wc":40.0,"lp":40.0,"lc":162.0,"e":1},"2025-09-07":{"cp":60.0,"cc":77.0,"wp":25.0,"wc":56.0,"lp":35.0,"lc":21.0,"e":1},"2025-09-08":{"cp":6.0,"cc":10.0,"wp":4.0,"wc":4.0,"lp":2.0,"lc":6.0,"e":1},"2025-09-09":{"cp":28.0,"cc":19.0,"wp":24.0,"wc":5.0,"lp":4.0,"lc":14.0,"e":1},"2025-09-10":{"cp":18.0,"cc":28.0,"wp":18.0,"wc":14.0,"lp":0.0,"lc":14.0,"e":1},"2025-09-11":{"cp":8.0,"cc":45.0,"wp":8.0,"wc":31.0,"lp":0.0,"lc":14.0,"e":1},"2025-09-12":{"cp":17.0,"cc":94.0,"wp":17.0,"wc":26.0,"lp":0.0,"lc":68.0,"e":1},"2025-09-13":{"cp":88.0,"cc":178.0,"wp":26.0,"wc":64.0,"lp":62.0,"lc":114.0,"e":1},"2025-09-14":{"cp":88.0,"cc":92.0,"wp":61.0,"wc":36.0,"lp":27.0,"lc":56.0,"e":1},"2025-09-15":{"cp":0.0,"cc":18.0,"wp":0,"wc":14.0,"lp":0.0,"lc":4.0,"e":1},"2025-09-16":{"cp":7.0,"cc":50.0,"wp":7.0,"wc":18.0,"lp":0.0,"lc":32.0,"e":1},"2025-09-17":{"cp":7.0,"cc":35.0,"wp":7.0,"wc":21.0,"lp":0.0,"lc":14.0,"e":1},"2025-09-18":{"cp":16.0,"cc":27.0,"wp":16.0,"wc":11.0,"lp":0.0,"lc":16.0,"e":1},"2025-09-19":{"cp":5.0,"cc":108.0,"wp":5.0,"wc":55.0,"lp":0.0,"lc":53.0,"e":1},"2025-09-20":{"cp":88.0,"cc":180.0,"wp":42.0,"wc":39.0,"lp":46.0,"lc":141.0,"e":1},"2025-09-21":{"cp":71.0,"cc":55.0,"wp":35.0,"wc":23.0,"lp":36.0,"lc":32.0,"e":1},"2025-09-22":{"cp":13.0,"cc":22.0,"wp":9.0,"wc":9.0,"lp":4.0,"lc":13.0,"e":1},"2025-09-23":{"cp":0.0,"cc":50.0,"wp":0,"wc":35.0,"lp":0.0,"lc":15.0,"e":1},"2025-09-24":{"cp":9.0,"cc":21.0,"wp":9.0,"wc":9.0,"lp":0.0,"lc":12.0,"e":1},"2025-09-25":{"cp":9.0,"cc":47.0,"wp":9.0,"wc":18.0,"lp":0.0,"lc":29.0,"e":1},"2025-09-26":{"cp":4.0,"cc":115.0,"wp":4.0,"wc":35.0,"lp":0.0,"lc":80.0,"e":1},"2025-09-27":{"cp":84.0,"cc":197.0,"wp":40.0,"wc":42.0,"lp":44.0,"lc":155.0,"e":1},"2025-09-28":{"cp":64.0,"cc":57.0,"wp":28.0,"wc":46.0,"lp":36.0,"lc":11.0,"e":1},"2025-09-29":{"cp":6.0,"cc":22.0,"wp":6.0,"wc":18.0,"lp":0.0,"lc":4.0,"e":1},"2025-09-30":{"cp":4.0,"cc":38.0,"wp":4.0,"wc":17.0,"lp":0.0,"lc":21.0,"e":1},"2025-10-01":{"cp":0.0,"cc":30.0,"wp":0,"wc":24.0,"lp":0.0,"lc":6.0,"e":1},"2025-10-02":{"cp":8.0,"cc":9.0,"wp":8.0,"wc":6.0,"lp":0.0,"lc":3.0,"e":1},"2025-10-03":{"cp":18.0,"cc":64.0,"wp":18.0,"wc":23.0,"lp":0.0,"lc":41.0,"e":1},"2025-10-04":{"cp":84.0,"cc":201.0,"wp":38.0,"wc":12.0,"lp":46.0,"lc":189.0,"e":1},"2025-10-05":{"cp":70.0,"cc":69.0,"wp":22.0,"wc":31.0,"lp":48.0,"lc":38.0,"e":1},"2025-10-06":{"cp":9.0,"cc":26.0,"wp":9.0,"wc":11.0,"lp":0.0,"lc":15.0,"e":1},"2025-10-07":{"cp":2.0,"cc":33.0,"wp":2.0,"wc":6.0,"lp":0.0,"lc":27.0,"e":1},"2025-10-08":{"cp":0.0,"cc":22.0,"wp":0,"wc":15.0,"lp":0.0,"lc":7.0,"e":1},"2025-10-09":{"cp":6.0,"cc":23.0,"wp":6.0,"wc":7.0,"lp":0.0,"lc":16.0,"e":1},"2025-10-10":{"cp":13.0,"cc":63.0,"wp":13.0,"wc":24.0,"lp":0.0,"lc":39.0,"e":1},"2025-10-11":{"cp":34.0,"cc":203.0,"wp":25.0,"wc":42.0,"lp":9.0,"lc":161.0,"e":1},"2025-10-12":{"cp":66.0,"cc":38.0,"wp":24.0,"wc":28.0,"lp":42.0,"lc":10.0,"e":1},"2025-10-13":{"cp":1.0,"cc":18.0,"wp":1.0,"wc":11.0,"lp":0.0,"lc":7.0,"e":1},"2025-10-14":{"cp":1.0,"cc":38.0,"wp":1.0,"wc":33.0,"lp":0.0,"lc":5.0,"e":1},"2025-10-15":{"cp":3.0,"cc":45.0,"wp":3.0,"wc":12.0,"lp":0.0,"lc":33.0,"e":1},"2025-10-16":{"cp":6.0,"cc":20.0,"wp":6.0,"wc":20.0,"lp":0.0,"lc":0.0,"e":1},"2025-10-17":{"cp":72.0,"cc":65.0,"wp":7.0,"wc":21.0,"lp":65.0,"lc":44.0,"e":1},"2025-10-18":{"cp":65.0,"cc":150.0,"wp":19.0,"wc":22.0,"lp":46.0,"lc":128.0,"e":1},"2025-10-19":{"cp":96.0,"cc":39.0,"wp":23.0,"wc":28.0,"lp":73.0,"lc":11.0,"e":1},"2025-10-20":{"cp":12.0,"cc":18.0,"wp":12.0,"wc":13.0,"lp":0.0,"lc":5.0,"e":1},"2025-10-21":{"cp":5.0,"cc":23.0,"wp":5.0,"wc":6.0,"lp":0.0,"lc":17.0,"e":1},"2025-10-22":{"cp":6.0,"cc":10.0,"wp":6.0,"wc":10.0,"lp":0.0,"lc":0.0,"e":1},"2025-10-23":{"cp":3.0,"cc":18.0,"wp":3.0,"wc":15.0,"lp":0.0,"lc":3.0,"e":1},"2025-10-24":{"cp":11.0,"cc":70.0,"wp":11.0,"wc":24.0,"lp":0.0,"lc":46.0,"e":1},"2025-10-25":{"cp":60.0,"cc":157.0,"wp":21.0,"wc":18.0,"lp":39.0,"lc":139.0,"e":1},"2025-10-26":{"cp":101.0,"cc":16.0,"wp":36.0,"wc":9.0,"lp":65.0,"lc":7.0,"e":1},"2025-10-27":{"cp":3.0,"cc":3.0,"wp":3.0,"wc":3.0,"lp":0.0,"lc":0.0,"e":1},"2025-10-28":{"cp":3.0,"cc":35.0,"wp":3.0,"wc":11.0,"lp":0.0,"lc":24.0,"e":1},"2025-10-29":{"cp":2.0,"cc":18.0,"wp":2.0,"wc":4.0,"lp":0.0,"lc":14.0,"e":1},"2025-10-30":{"cp":0.0,"cc":13.0,"wp":0,"wc":13.0,"lp":0.0,"lc":0.0,"e":1},"2025-10-31":{"cp":17.0,"cc":180.0,"wp":17.0,"wc":19.0,"lp":0.0,"lc":164.0,"e":1},"2025-11-01":{"cp":157.0,"cc":185.0,"wp":47.0,"wc":27.0,"lp":110.0,"lc":158.0,"e":1},"2025-11-02":{"cp":163.0,"cc":54.0,"wp":42.0,"wc":25.0,"lp":121.0,"lc":29.0,"e":1},"2025-11-03":{"cp":0.0,"cc":6.0,"wp":0,"wc":6.0,"lp":0.0,"lc":0.0,"e":1},"2025-11-04":{"cp":7.0,"cc":55.0,"wp":4.0,"wc":27.0,"lp":3.0,"lc":28.0,"e":1},"2025-11-05":{"cp":13.0,"cc":11.0,"wp":13.0,"wc":7.0,"lp":0.0,"lc":4.0,"e":1},"2025-11-06":{"cp":0.0,"cc":28.0,"wp":0,"wc":18.0,"lp":4.0,"lc":10.0,"e":1},"2025-11-07":{"cp":19.0,"cc":115.0,"wp":19.0,"wc":49.0,"lp":0.0,"lc":66.0,"e":1},"2025-11-08":{"cp":34.0,"cc":204.0,"wp":17.0,"wc":28.0,"lp":17.0,"lc":176.0,"e":1},"2025-11-09":{"cp":101.0,"cc":39.0,"wp":60.0,"wc":14.0,"lp":51.0,"lc":25.0,"e":1},"2025-11-10":{"cp":8.0,"cc":34.0,"wp":8.0,"wc":36.0,"lp":0.0,"lc":0.0,"e":1},"2025-11-11":{"cp":11.0,"cc":39.0,"wp":2.0,"wc":24.0,"lp":9.0,"lc":15.0,"e":1},"2025-11-12":{"cp":2.0,"cc":31.0,"wp":2.0,"wc":6.0,"lp":0.0,"lc":25.0,"e":1},"2025-11-13":{"cp":6.0,"cc":25.0,"wp":6.0,"wc":19.0,"lp":0.0,"lc":6.0,"e":1},"2025-11-14":{"cp":9.0,"cc":77.0,"wp":8.0,"wc":42.0,"lp":3.0,"lc":41.0,"e":1},"2025-11-15":{"cp":149.0,"cc":185.0,"wp":31.0,"wc":15.0,"lp":118.0,"lc":170.0,"e":1},"2025-11-16":{"cp":130.0,"cc":48.0,"wp":56.0,"wc":18.0,"lp":79.0,"lc":33.0,"e":1},"2025-11-17":{"cp":10.0,"cc":22.0,"wp":5.0,"wc":11.0,"lp":5.0,"lc":11.0,"e":1},"2025-11-18":{"cp":3.0,"cc":17.0,"wp":3.0,"wc":7.0,"lp":0.0,"lc":10.0,"e":1},"2025-11-19":{"cp":6.0,"cc":14.0,"wp":6.0,"wc":7.0,"lp":0.0,"lc":7.0,"e":1},"2025-11-20":{"cp":4.0,"cc":6.0,"wp":4.0,"wc":8.0,"lp":0.0,"lc":0.0,"e":1},"2025-11-21":{"cp":5.0,"cc":94.0,"wp":5.0,"wc":30.0,"lp":0.0,"lc":68.0,"e":1},"2025-11-22":{"cp":72.0,"cc":110.0,"wp":41.0,"wc":41.0,"lp":31.0,"lc":69.0,"e":1},"2025-11-23":{"cp":131.0,"cc":31.0,"wp":31.0,"wc":22.0,"lp":100.0,"lc":9.0,"e":1},"2025-11-24":{"cp":15.0,"cc":7.0,"wp":15.0,"wc":7.0,"lp":0.0,"lc":0.0,"e":1},"2025-11-25":{"cp":7.0,"cc":17.0,"wp":7.0,"wc":7.0,"lp":0.0,"lc":10.0,"e":1},"2025-11-26":{"cp":2.0,"cc":21.0,"wp":2.0,"wc":14.0,"lp":0.0,"lc":7.0,"e":1},"2025-11-27":{"cp":9.0,"cc":53.0,"wp":9.0,"wc":24.0,"lp":0.0,"lc":29.0,"e":1},"2025-11-28":{"cp":9.0,"cc":88.0,"wp":9.0,"wc":39.0,"lp":0.0,"lc":51.0,"e":1},"2025-11-29":{"cp":95.0,"cc":154.0,"wp":27.0,"wc":35.0,"lp":68.0,"lc":119.0,"e":1},"2025-11-30":{"cp":110.0,"cc":64.0,"wp":49.0,"wc":13.0,"lp":61.0,"lc":51.0,"e":1},"2025-12-01":{"cp":16.0,"cc":11.0,"wp":10.0,"wc":11.0,"lp":6.0,"lc":0.0,"e":1},"2025-12-02":{"cp":0.0,"cc":30.0,"wp":0,"wc":19.0,"lp":0.0,"lc":11.0,"e":1},"2025-12-03":{"cp":2.0,"cc":35.0,"wp":2.0,"wc":28.0,"lp":0.0,"lc":7.0,"e":1},"2025-12-04":{"cp":0.0,"cc":24.0,"wp":0,"wc":17.0,"lp":0.0,"lc":7.0,"e":1},"2025-12-05":{"cp":1.0,"cc":46.0,"wp":1.0,"wc":24.0,"lp":0.0,"lc":22.0,"e":1},"2025-12-06":{"cp":53.0,"cc":141.0,"wp":22.0,"wc":29.0,"lp":31.0,"lc":112.0,"e":1},"2025-12-07":{"cp":121.0,"cc":85.0,"wp":35.0,"wc":42.0,"lp":86.0,"lc":43.0,"e":1},"2025-12-08":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":48.0,"lc":52.0,"e":1},"2025-12-09":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":4.0,"lc":40.0,"e":1},"2025-12-10":{"cp":7.0,"cc":28.0,"wp":7.0,"wc":19.0,"lp":0.0,"lc":9.0,"e":1},"2025-12-11":{"cp":2.0,"cc":83.0,"wp":0,"wc":12.0,"lp":3.0,"lc":71.0,"e":1},"2025-12-12":{"cp":6.0,"cc":149.0,"wp":6.0,"wc":28.0,"lp":0.0,"lc":121.0,"e":1},"2025-12-13":{"cp":75.0,"cc":162.0,"wp":26.0,"wc":19.0,"lp":65.0,"lc":149.0,"e":1},"2025-12-14":{"cp":106.0,"cc":0.0,"wp":48.0,"wc":0,"lp":60.0,"lc":40.0,"e":1},"2025-12-15":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":0.0,"lc":0.0,"e":1},"2025-12-16":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":0.0,"lc":72.0,"e":1},"2025-12-17":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":0.0,"lc":32.0,"e":1},"2025-12-18":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":0.0,"lc":14.0,"e":1},"2025-12-19":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":0.0,"lc":74.0,"e":1},"2025-12-20":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":19.0,"lc":126.0,"e":1},"2025-12-21":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":27.0,"lc":82.0,"e":1},"2025-12-22":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":28.0,"lc":54.0,"e":1},"2025-12-23":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":6.0,"lc":63.0,"e":1},"2025-12-24":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":13.0,"lc":25.0,"e":1},"2025-12-26":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":72.0,"lc":24.0,"e":1},"2025-12-27":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":40.0,"lc":70.0,"e":1},"2025-12-28":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":49.0,"lc":39.0,"e":1},"2025-12-29":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":28.0,"lc":51.0,"e":1},"2025-12-30":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":19.0,"lc":50.0,"e":1},"2025-12-31":{"cp":0.0,"cc":0.0,"wp":0,"wc":0,"lp":10.0,"lc":81.0,"e":1},"2026-01-01":{"cp":27.0,"cc":17.0,"wp":11.0,"wc":7.0,"lp":16.0,"lc":10.0,"e":1},"2026-01-02":{"cp":54.0,"cc":60.0,"wp":35.0,"wc":26.0,"lp":19.0,"lc":34.0,"e":1},"2026-01-03":{"cp":73.0,"cc":140.0,"wp":37.0,"wc":82.0,"lp":36.0,"lc":68.0,"e":1},"2026-01-04":{"cp":99.0,"cc":100.0,"wp":46.0,"wc":60.0,"lp":53.0,"lc":40.0,"e":1},"2026-01-05":{"cp":86.0,"cc":109.0,"wp":57.0,"wc":59.0,"lp":29.0,"lc":50.0,"e":1},"2026-01-06":{"cp":119.0,"cc":166.0,"wp":26.0,"wc":144.0,"lp":93.0,"lc":22.0,"e":1},"2026-01-07":{"cp":1.0,"cc":7.0,"wp":1.0,"wc":7.0,"lp":0.0,"lc":0.0,"e":1},"2026-01-08":{"cp":2.0,"cc":21.0,"wp":2.0,"wc":21.0,"lp":0.0,"lc":0.0,"e":1},"2026-01-09":{"cp":0.0,"cc":72.0,"wp":0,"wc":34.0,"lp":0.0,"lc":38.0,"e":1},"2026-01-10":{"cp":76.0,"cc":146.0,"wp":20.0,"wc":27.0,"lp":56.0,"lc":129.0,"e":1},"2026-01-11":{"cp":150.0,"cc":208.0,"wp":27.0,"wc":196.0,"lp":123.0,"lc":12.0,"e":1},"2026-01-12":{"cp":9.0,"cc":24.0,"wp":7.0,"wc":10.0,"lp":2.0,"lc":14.0,"e":1},"2026-01-13":{"cp":5.0,"cc":30.0,"wp":5.0,"wc":11.0,"lp":0.0,"lc":19.0,"e":1},"2026-01-14":{"cp":9.0,"cc":23.0,"wp":9.0,"wc":23.0,"lp":0.0,"lc":0.0,"e":1},"2026-01-15":{"cp":8.0,"cc":22.0,"wp":6.0,"wc":12.0,"lp":2.0,"lc":10.0,"e":1},"2026-01-16":{"cp":11.0,"cc":72.0,"wp":11.0,"wc":28.0,"lp":0.0,"lc":44.0,"e":1},"2026-01-17":{"cp":124.0,"cc":184.0,"wp":61.0,"wc":13.0,"lp":63.0,"lc":171.0,"e":1},"2026-01-18":{"cp":143.0,"cc":54.0,"wp":35.0,"wc":28.0,"lp":108.0,"lc":26.0,"e":1},"2026-01-19":{"cp":0.0,"cc":11.0,"wp":0,"wc":8.0,"lp":0.0,"lc":3.0,"e":1},"2026-01-20":{"cp":3.0,"cc":40.0,"wp":1.0,"wc":27.0,"lp":2.0,"lc":13.0,"e":1},"2026-01-21":{"cp":5.0,"cc":21.0,"wp":5.0,"wc":7.0,"lp":0.0,"lc":14.0,"e":1},"2026-01-22":{"cp":10.0,"cc":24.0,"wp":7.0,"wc":21.0,"lp":3.0,"lc":3.0,"e":1},"2026-01-23":{"cp":13.0,"cc":74.0,"wp":13.0,"wc":29.0,"lp":0.0,"lc":45.0,"e":1},"2026-01-24":{"cp":131.0,"cc":194.0,"wp":14.0,"wc":9.0,"lp":117.0,"lc":185.0,"e":1},"2026-01-25":{"cp":165.0,"cc":62.0,"wp":20.0,"wc":32.0,"lp":145.0,"lc":30.0,"e":1},"2026-01-26":{"cp":8.0,"cc":16.0,"wp":8.0,"wc":16.0,"lp":0.0,"lc":0.0,"e":1},"2026-01-27":{"cp":7.0,"cc":38.0,"wp":3.0,"wc":24.0,"lp":4.0,"lc":14.0,"e":1},"2026-01-28":{"cp":2.0,"cc":29.0,"wp":2.0,"wc":9.0,"lp":0.0,"lc":20.0,"e":1},"2026-01-29":{"cp":9.0,"cc":66.0,"wp":9.0,"wc":29.0,"lp":0.0,"lc":37.0,"e":1},"2026-01-30":{"cp":11.0,"cc":109.0,"wp":11.0,"wc":32.0,"lp":0.0,"lc":83.0,"e":1},"2026-01-31":{"cp":79.0,"cc":188.0,"wp":30.0,"wc":27.0,"lp":49.0,"lc":161.0,"e":1},"2026-02-01":{"cp":133.0,"cc":90.0,"wp":21.0,"wc":41.0,"lp":116.0,"lc":49.0,"e":1},"2026-02-02":{"cp":8.0,"cc":26.0,"wp":8.0,"wc":5.0,"lp":0.0,"lc":21.0,"e":1},"2026-02-03":{"cp":5.0,"cc":44.0,"wp":8.0,"wc":31.0,"lp":0.0,"lc":19.0,"e":1},"2026-02-04":{"cp":0.0,"cc":11.0,"wp":0,"wc":6.0,"lp":0.0,"lc":5.0,"e":1},"2026-02-05":{"cp":16.0,"cc":21.0,"wp":20.0,"wc":13.0,"lp":0.0,"lc":8.0,"e":1},"2026-02-06":{"cp":27.0,"cc":91.0,"wp":6.0,"wc":40.0,"lp":21.0,"lc":55.0,"e":1},"2026-02-07":{"cp":68.0,"cc":187.0,"wp":19.0,"wc":24.0,"lp":49.0,"lc":165.0,"e":1},"2026-02-08":{"cp":132.0,"cc":52.0,"wp":30.0,"wc":33.0,"lp":102.0,"lc":23.0,"e":1},"2026-02-09":{"cp":4.0,"cc":19.0,"wp":4.0,"wc":0,"lp":0.0,"lc":19.0,"e":1},"2026-02-10":{"cp":4.0,"cc":35.0,"wp":4.0,"wc":11.0,"lp":0.0,"lc":28.0,"e":1},"2026-02-11":{"cp":9.0,"cc":8.0,"wp":9.0,"wc":8.0,"lp":0.0,"lc":0.0,"e":1},"2026-02-12":{"cp":6.0,"cc":59.0,"wp":3.0,"wc":18.0,"lp":3.0,"lc":41.0,"e":1},"2026-02-13":{"cp":71.0,"cc":138.0,"wp":1.0,"wc":15.0,"lp":70.0,"lc":123.0,"e":1},"2026-02-14":{"cp":109.0,"cc":189.0,"wp":24.0,"wc":38.0,"lp":85.0,"lc":169.0,"e":1},"2026-02-15":{"cp":129.0,"cc":62.0,"wp":36.0,"wc":31.0,"lp":95.0,"lc":31.0,"e":1},"2026-02-16":{"cp":9.0,"cc":4.0,"wp":4.0,"wc":4.0,"lp":5.0,"lc":0.0,"e":1},"2026-02-17":{"cp":10.0,"cc":56.0,"wp":7.0,"wc":14.0,"lp":3.0,"lc":42.0,"e":1},"2026-02-18":{"cp":14.0,"cc":20.0,"wp":6.0,"wc":12.0,"lp":8.0,"lc":8.0,"e":1},"2026-02-19":{"cp":29.0,"cc":72.0,"wp":28.0,"wc":36.0,"lp":4.0,"lc":36.0,"e":1},"2026-02-20":{"cp":85.0,"cc":104.0,"wp":33.0,"wc":44.0,"lp":52.0,"lc":60.0,"e":1},"2026-02-21":{"cp":72.0,"cc":183.0,"wp":21.0,"wc":38.0,"lp":51.0,"lc":156.0,"e":1},"2026-02-22":{"cp":57.0,"cc":81.0,"wp":28.0,"wc":26.0,"lp":29.0,"lc":57.0,"e":1},"2026-02-23":{"cp":0.0,"cc":33.0,"wp":0,"wc":23.0,"lp":0.0,"lc":10.0,"e":1},"2026-02-24":{"cp":11.0,"cc":30.0,"wp":4.0,"wc":7.0,"lp":7.0,"lc":23.0,"e":1},"2026-02-25":{"cp":2.0,"cc":25.0,"wp":2.0,"wc":20.0,"lp":0.0,"lc":5.0,"e":1},"2026-02-26":{"cp":0.0,"cc":14.0,"wp":0,"wc":8.0,"lp":0.0,"lc":6.0,"e":1},"2026-02-27":{"cp":5.0,"cc":164.0,"wp":3.0,"wc":31.0,"lp":2.0,"lc":133.0,"e":1},"2026-02-28":{"cp":26.0,"cc":172.0,"wp":15.0,"wc":16.0,"lp":11.0,"lc":167.0,"e":1},"2026-03-01":{"cp":111.0,"cc":59.0,"wp":28.0,"wc":14.0,"lp":83.0,"lc":45.0,"e":1},"2026-03-02":{"cp":7.0,"cc":22.0,"wp":5.0,"wc":13.0,"lp":2.0,"lc":9.0,"e":1},"2026-03-03":{"cp":2.0,"cc":60.0,"wp":2.0,"wc":38.0,"lp":0.0,"lc":22.0,"e":1},"2026-03-04":{"cp":5.0,"cc":18.0,"wp":5.0,"wc":14.0,"lp":0.0,"lc":4.0,"e":1},"2026-03-05":{"cp":53.0,"cc":26.0,"wp":11.0,"wc":9.0,"lp":42.0,"lc":17.0,"e":1},"2026-03-06":{"cp":0.0,"cc":103.0,"wp":0,"wc":20.0,"lp":0.0,"lc":83.0,"e":1},"2026-03-07":{"cp":50.0,"cc":167.0,"wp":34.0,"wc":40.0,"lp":16.0,"lc":136.0,"e":1},"2026-03-08":{"cp":116.0,"cc":77.0,"wp":53.0,"wc":30.0,"lp":63.0,"lc":47.0,"e":1},"2026-03-09":{"cp":11.0,"cc":52.0,"wp":5.0,"wc":35.0,"lp":6.0,"lc":17.0,"e":1},"2026-03-10":{"cp":13.0,"cc":17.0,"wp":13.0,"wc":2.0,"lp":0.0,"lc":15.0,"e":1},"2026-03-11":{"cp":6.0,"cc":41.0,"wp":6.0,"wc":25.0,"lp":0.0,"lc":16.0,"e":1},"2026-03-12":{"cp":4.0,"cc":57.0,"wp":2.0,"wc":29.0,"lp":2.0,"lc":28.0,"e":1},"2026-03-13":{"cp":45.0,"cc":88.0,"wp":5.0,"wc":7.0,"lp":40.0,"lc":81.0,"e":1},"2026-03-14":{"cp":86.0,"cc":188.0,"wp":21.0,"wc":22.0,"lp":70.0,"lc":166.0,"e":1},"2026-03-15":{"cp":186.0,"cc":75.0,"wp":17.0,"wc":26.0,"lp":169.0,"lc":49.0,"e":1},"2026-03-16":{"cp":15.0,"cc":25.0,"wp":15.0,"wc":10.0,"lp":0.0,"lc":15.0,"e":1},"2026-03-17":{"cp":9.0,"cc":53.0,"wp":9.0,"wc":17.0,"lp":0.0,"lc":36.0,"e":1},"2026-03-18":{"cp":3.0,"cc":16.0,"wp":3.0,"wc":12.0,"lp":0.0,"lc":4.0,"e":1},"2026-03-19":{"cp":21.0,"cc":121.0,"wp":21.0,"wc":12.0,"lp":0.0,"lc":109.0,"e":1}};
  // Merge con dati inseriti dall'utente nel localStorage
  try {
    const userStr = localStorage.getItem('alea_storico_v2');
    if (userStr) {
      const user: Record<string, StoricoEntry> = JSON.parse(userStr);
      return { ...base, ...user };
    }
  } catch {}
  return base;
}

export function salvaVerificaServizio(
  data: string,
  cp: number, cc: number,
  pren_eff_p: number, pren_eff_c: number,
  pren_lordi_p = 0, pren_lordi_c = 0,
) {
  try {
    const userStr = localStorage.getItem('alea_storico_v2');
    const user: Record<string, StoricoEntry> = userStr ? JSON.parse(userStr) : {};
    const d = new Date(data + 'T12:00:00');
    const epoca = d >= DATA_PREN ? 1 : 0;
    user[data] = {
      cp, cc,
      wp: Math.max(0, cp - pren_eff_p),
      wc: Math.max(0, cc - pren_eff_c),
      lp: pren_lordi_p || pren_eff_p,
      lc: pren_lordi_c || pren_eff_c,
      e: epoca,
    };
    localStorage.setItem('alea_storico_v2', JSON.stringify(user));
  } catch (e) { console.error('Errore salvataggio storico:', e); }
}

// ── COSTRUZIONE VETTORE FEATURES ────────────────────────────────
export function buildX(
  d: Date,
  tipo: 'gio_p' | 'gio_c' | 'set_p' | 'set_c',
  pren_lordi_p: number,
  pren_lordi_c: number,
  temp_p: number, piog_p: number,
  temp_c: number, piog_c: number,
  storico: Record<string, StoricoEntry>,
): number[] {
  const dow = (d.getDay() + 6) % 7; // 0=lun...6=dom (Python weekday)
  const mese = d.getMonth() + 1;
  const sett = getISOWeek(d);
  const trim = Math.ceil(mese / 3);
  const gm   = d.getDate();
  const festivo = isFestivo(d);
  const prefestivo = isPrefestivo(d);
  const de = dowEff(dow, festivo);
  const epoca = d >= DATA_PREN ? 1 : 0;
  const weekend = dow >= 5 ? 1 : 0;
  const venerdi = dow === 4 ? 1 : 0;
  const martedi_kid = dow === 1 ? 1 : 0;
  const lmn = (dow === 0 || dow === 1) && !festivo ? 1 : 0;

  // prc e crc sono flag binari basati su de (effettivo day-of-week)
  const prc = (de === 5 || de === 6) ? 1 : 0;
  const crc = (de === 4 || de === 5) ? 1 : 0;

  // Tasso no-show per questo dow/mese
  const nsRates: Record<string, number> = {"p_2_9":0.0,"p_5_9":0.0,"p_6_9":0.0,"p_0_9":0.0,"p_1_9":0.0,"p_5_10":0.0,"p_6_10":0.0,"p_4_10":0.0,"p_5_11":0.0,"p_6_11":0.0519,"p_1_11":0.0,"p_3_11":0.0,"p_4_11":0.6667,"p_0_11":0.0,"p_0_12":0.0,"p_5_12":0.0615,"p_6_12":0.0083,"p_1_12":0.0,"p_3_12":0.0,"p_2_12":0.0,"p_4_12":0.0,"p_3_1":0.0,"p_4_1":0.0,"p_5_1":0.0,"p_6_1":0.0,"p_0_1":0.0,"p_1_1":0.0,"p_6_2":0.0139,"p_4_2":0.0,"p_5_2":0.0,"p_3_2":0.375,"p_0_2":0.0,"p_1_2":0.0,"p_2_2":0.0,"p_6_3":0.0,"p_0_3":0.0,"p_3_3":0.0,"p_5_3":0.0357,"p_4_3":0.0,"c_0_9":0.0,"c_1_9":0.0,"c_2_9":0.0,"c_3_9":0.0,"c_4_9":0.0,"c_5_9":0.0,"c_6_9":0.0,"c_2_10":0.0,"c_3_10":0.0,"c_4_10":0.0037,"c_5_10":0.0,"c_6_10":0.0,"c_0_10":0.0,"c_1_10":0.0,"c_5_11":0.0,"c_6_11":0.0182,"c_1_11":0.0,"c_2_11":0.0,"c_3_11":0.0,"c_4_11":0.0611,"c_0_11":0.0,"c_1_12":0.0,"c_2_12":0.0,"c_3_12":0.0714,"c_4_12":0.0625,"c_5_12":0.0101,"c_6_12":0.0,"c_0_12":0.0,"c_3_1":0.0,"c_4_1":0.0145,"c_5_1":0.0449,"c_6_1":0.0,"c_0_1":0.0,"c_1_1":0.0,"c_2_1":0.0,"c_6_2":0.0523,"c_0_2":0.0,"c_1_2":0.1147,"c_2_2":0.0,"c_3_2":0.0,"c_4_2":0.0182,"c_5_2":0.0638,"c_6_3":0.0,"c_0_3":0.0,"c_1_3":0.0,"c_2_3":0.0,"c_3_3":0.0,"c_4_3":0.0,"c_5_3":0.0331};
  const ns_p = nsRates[`p_${dow}_${mese}`] ?? 0;
  const ns_c = nsRates[`c_${dow}_${mese}`] ?? 0;

  // pf_p, pnn_p, ns_p_feat (solo dopo DATA_PREN)
  const pf_p    = pren_lordi_p * epoca;
  const pnn_p   = pren_lordi_p * (1 - ns_p) * epoca;
  const ns_p_feat = ns_p * epoca;
  const pf_c    = pren_lordi_c * epoca;
  const pnn_c   = pren_lordi_c * (1 - ns_c) * epoca;
  const ns_c_feat = ns_c * epoca;

  // Shift features: valori ESATTI di N giorni fa
  const fmt = (dd: Date) => dd.toISOString().split('T')[0];
  const ago = (n: number) => { const dd = new Date(d); dd.setDate(d.getDate() - n); return fmt(dd); };

  const s7  = storico[ago(7)];
  const s14 = storico[ago(14)];
  const s21 = storico[ago(21)];
  const s28 = storico[ago(28)];

  const wp7  = s7  ? s7.wp  : 0;
  const wp14 = s14 ? s14.wp : 0;
  const wp21 = s21 ? s21.wp : 0;
  const wp28 = s28 ? s28.wp : 0;
  const wc7  = s7  ? s7.wc  : 0;
  const wc14 = s14 ? s14.wc : 0;
  const wc21 = s21 ? s21.wc : 0;
  const wc28 = s28 ? s28.wc : 0;

  const cp7 = s7 ? s7.cp : 0;
  const cc7 = s7 ? s7.cc : 0;

  const wps = wp7 * 0.40 + wp14 * 0.35 + wp21 * 0.15 + wp28 * 0.10;
  const wcs = wc7 * 0.40 + wc14 * 0.35 + wc21 * 0.15 + wc28 * 0.10;
  const wp4 = (wp7 + wp14 + wp21 + wp28) / 4;
  const wc4 = (wc7 + wc14 + wc21 + wc28) / 4;

  // pp7, pc7: prenotati lordi di 7 giorni fa * epoca di 7 giorni fa
  const pp7 = s7 ? s7.lp * s7.e : 0;
  const pc7 = s7 ? s7.lc * s7.e : 0;

  // zp, zc: z-score rispetto a media storica per (de, mese)
  const stStor = ST_STOR_STATS;
  const key = `${de}_${mese}`;
  const ss = stStor[key] ?? { media_p: 10, std_p: 5, media_c: 50, std_c: 20 };
  const zp = (cp7 - ss.media_p) / Math.max(1, ss.std_p);
  const zc = (cc7 - ss.media_c) / Math.max(1, ss.std_c);

  const BASE = [de, mese, sett, trim, gm, weekend, venerdi,
                prefestivo ? 1 : 0, festivo ? 1 : 0,
                martedi_kid, lmn, prc, crc,
                temp_p, piog_p, 0, temp_c, piog_c, 0,
                zp, zc, epoca];

  if (tipo === 'gio_p') return [...BASE, pf_p, pnn_p, ns_p_feat, 0, wp7, wp14, wp28, wps, wp4, pp7, cp7];
  if (tipo === 'gio_c') return [...BASE, pf_c, pnn_c, ns_c_feat, 0, wc7, wc14, wc28, wcs, wc4, pc7, cc7];
  if (tipo === 'set_p') return [...BASE, 0, wp7, wp14, wp28, wps, wp4, pp7, cp7];
  /* set_c */          return [...BASE, 0, wc7, wc14, wc28, wcs, wc4, pc7, cc7];
}

export function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ── LOGICA CONVOCAZIONE (da motore_previsionale.py, generalizzata) ──
// La soglia di picco è proporzionale alla fascia: 25% della fascia camerieri
// (es. fascia 20 → soglia picco 5, fascia 25 → 12 come originale)
export function fasciaCam(cop: number, ratio: number = FASCIA): number {
  if (cop <= 0) return 1;
  return Math.max(1, Math.ceil(cop / ratio));
}

export function convocazione(stima: number, rlo: number, rhi: number, ratio: number = FASCIA): ConvocazioneResult {
  const fasciaS = ratio * 1.20;
  const sogliaPicko = Math.floor(fasciaS * 0.50);

  // cam base sulla fascia inferiore
  const camHi = fasciaCam(stima, fasciaS);
  const camLo = Math.max(1, camHi - 1);
  const sogliaLo = camLo * fasciaS;
  const sforoStima = stima - sogliaLo;  // quanto la stima sfora la soglia di camLo
  const sforoRhi   = rhi   - sogliaLo;

  if (sforoStima > sogliaPicko) {
    // Stima sfora abbondantemente la fascia inferiore → fascia superiore
    return { cam_fissi: camHi, cam_picco: 0, tipo: 'fissi_alto',
             messaggio: `${camHi} ${camHi === 1 ? 'cameriere' : 'camerieri'}`,
             alternativa: '' };
  } else if (sforoStima > 0) {
    // Stima sfora poco → camLo fissi + 1 picco
    return { cam_fissi: camLo, cam_picco: 1, tipo: 'picco',
             messaggio: `${camLo} fissi + 1 picco`,
             alternativa: `oppure ${camLo + 1} fissi se picco prolungato` };
  } else {
    // Stima nella fascia — controlla rhi
    if (sforoRhi > sogliaPicko) {
      return { cam_fissi: camLo, cam_picco: 0, tipo: 'fissi',
               messaggio: `${camLo} ${camLo === 1 ? 'cameriere' : 'camerieri'}`,
               alternativa: `⚠️ range ampio — valuta +1 eventualmente durante il picco` };
    }
    return { cam_fissi: camLo, cam_picco: 0, tipo: 'fissi',
             messaggio: `${camLo} ${camLo === 1 ? 'cameriere' : 'camerieri'}`,
             alternativa: '' };
  }
}

export function convocazioneSettimanale(stima: number, rlo: number, rhi: number, ratio: number = FASCIA) {
  const fasciaS = ratio * 1.20;
  const cam = fasciaCam(stima, fasciaS);
  const sforo = rhi - cam * fasciaS;
  const delta = fasciaCam(rhi, fasciaS) - cam;
  if (sforo <= 0) {
    return { cam_fissi: cam, cam_chiamata: 0, messaggio: `${cam} ${cam === 1 ? 'cameriere' : 'camerieri'}`, nota: '' };
  } else if (delta === 1) {
    return { cam_fissi: cam, cam_chiamata: 1, messaggio: `${cam} ${cam === 1 ? 'cameriere' : 'camerieri'}`,
             nota: '+1 a chiamata (confermare con previsione giornaliera)' };
  } else {
    const d2 = Math.min(delta, 2);
    return { cam_fissi: cam, cam_chiamata: d2, messaggio: `${cam} ${cam === 1 ? 'cameriere' : 'camerieri'}`,
             nota: `+${d2} a chiamata — alta incertezza, conferma con previsione giornaliera` };
  }
}

// ── API PUBBLICA ─────────────────────────────────────────────────
export function prevediGiorno(
  data: string,
  weather: { temp_pranzo: number; pioggia_pranzo: number; temp_cena: number; pioggia_cena: number; },
  pren_lordi_p = 0,
  pren_lordi_c = 0,
): PrevisioneGiorno {
  const storico = getStorico();
  const d = new Date(data + 'T12:00:00');
  const mod = MODEL_WEIGHTS;
  const xp = buildX(d, 'gio_p', pren_lordi_p, pren_lordi_c, weather.temp_pranzo, weather.pioggia_pranzo, weather.temp_cena, weather.pioggia_cena, storico);
  const xc = buildX(d, 'gio_c', pren_lordi_p, pren_lordi_c, weather.temp_pranzo, weather.pioggia_pranzo, weather.temp_cena, weather.pioggia_cena, storico);

  // Previsione dei WALK-IN
  const wlo_p = Math.round(predictGBM(mod.lo_p, xp));
  const wmed_p = Math.round(predictGBM(mod.mw_p, xp));
  const whi_p = Math.round(predictGBM(mod.hi_p, xp));
  const wlo_c = Math.round(predictGBM(mod.lo_c, xc));
  const wmed_c = Math.round(predictGBM(mod.mw_c, xc));
  const whi_c = Math.round(predictGBM(mod.hi_c, xc));

  // Coperti totali = prenotati effettivi (lordi * (1-ns)) + walk-in
  const epoca = d >= DATA_PREN ? 1 : 0;
  const ns_rates: Record<string, number> = {"p_2_9":0.0,"p_5_9":0.0,"p_6_9":0.0,"p_0_9":0.0,"p_1_9":0.0,"p_5_10":0.0,"p_6_10":0.0,"p_4_10":0.0,"p_5_11":0.0,"p_6_11":0.0519,"p_1_11":0.0,"p_3_11":0.0,"p_4_11":0.6667,"p_0_11":0.0,"p_0_12":0.0,"p_5_12":0.0615,"p_6_12":0.0083,"p_1_12":0.0,"p_3_12":0.0,"p_2_12":0.0,"p_4_12":0.0,"p_3_1":0.0,"p_4_1":0.0,"p_5_1":0.0,"p_6_1":0.0,"p_0_1":0.0,"p_1_1":0.0,"p_6_2":0.0139,"p_4_2":0.0,"p_5_2":0.0,"p_3_2":0.375,"p_0_2":0.0,"p_1_2":0.0,"p_2_2":0.0,"p_6_3":0.0,"p_0_3":0.0,"p_3_3":0.0,"p_5_3":0.0357,"p_4_3":0.0,"c_0_9":0.0,"c_1_9":0.0,"c_2_9":0.0,"c_3_9":0.0,"c_4_9":0.0,"c_5_9":0.0,"c_6_9":0.0,"c_2_10":0.0,"c_3_10":0.0,"c_4_10":0.0037,"c_5_10":0.0,"c_6_10":0.0,"c_0_10":0.0,"c_1_10":0.0,"c_5_11":0.0,"c_6_11":0.0182,"c_1_11":0.0,"c_2_11":0.0,"c_3_11":0.0,"c_4_11":0.0611,"c_0_11":0.0,"c_1_12":0.0,"c_2_12":0.0,"c_3_12":0.0714,"c_4_12":0.0625,"c_5_12":0.0101,"c_6_12":0.0,"c_0_12":0.0,"c_3_1":0.0,"c_4_1":0.0145,"c_5_1":0.0449,"c_6_1":0.0,"c_0_1":0.0,"c_1_1":0.0,"c_2_1":0.0,"c_6_2":0.0523,"c_0_2":0.0,"c_1_2":0.1147,"c_2_2":0.0,"c_3_2":0.0,"c_4_2":0.0182,"c_5_2":0.0638,"c_6_3":0.0,"c_0_3":0.0,"c_1_3":0.0,"c_2_3":0.0,"c_3_3":0.0,"c_4_3":0.0,"c_5_3":0.0331};
  const dow = (d.getDay() + 6) % 7;
  const mese = d.getMonth() + 1;
  const ns_p = ns_rates[`p_${dow}_${mese}`] ?? 0;
  const ns_c = ns_rates[`c_${dow}_${mese}`] ?? 0;
  const pnn_p = Math.round(pren_lordi_p * (1 - ns_p) * epoca);
  const pnn_c = Math.round(pren_lordi_c * (1 - ns_c) * epoca);

  return {
    data,
    pranzo: {
      lo:    pnn_p + wlo_p,
      media: pnn_p + wmed_p,
      hi:    pnn_p + whi_p,
      walkin_lo: wlo_p, walkin_med: wmed_p, walkin_hi: whi_p,
    },
    cena: {
      lo:    pnn_c + wlo_c,
      media: pnn_c + wmed_c,
      hi:    pnn_c + whi_c,
      walkin_lo: wlo_c, walkin_med: wmed_c, walkin_hi: whi_c,
    },
  };
}

export function prevediSettimana(
  startDate: string,
  weatherForecast: Array<{ temp_pranzo: number; pioggia_pranzo: number; temp_cena: number; pioggia_cena: number; }>,
): PrevisioneGiorno[] {
  // Per la previsione settimanale usiamo le statistiche_storiche (coperti totali)
  // perché non abbiamo i prenotati futuri — il modello walk-in darebbe valori troppo bassi
  const stStor = ST_STOR_STATS;
  const result: PrevisioneGiorno[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const data = d.toISOString().split('T')[0];
    const dow = (d.getDay() + 6) % 7; // 0=lun...6=dom
    const mese = d.getMonth() + 1;
    const festivo = isFestivo(d);
    const de = dowEff(dow, festivo);
    const key = `${de}_${mese}`;
    const s = stStor[key] ?? { media_p: 10, std_p: 5, media_c: 50, std_c: 20 };

    // Aggiusta per meteo
    const w = weatherForecast[i] ?? { temp_pranzo: 18, pioggia_pranzo: 0, temp_cena: 16, pioggia_cena: 0 };
    const mf_p = w.pioggia_pranzo > 5 ? 0.85 : 1.0;
    const mf_c = w.pioggia_cena   > 5 ? 0.85 : 1.0;

    const med_p = Math.round(s.media_p * mf_p);
    const std_p = s.std_p;
    const med_c = Math.round(s.media_c * mf_c);
    const std_c = s.std_c;

    result.push({
      data,
      pranzo: {
        lo:    Math.max(0, Math.round((s.media_p - std_p * 0.7) * mf_p)),
        media: med_p,
        hi:    Math.round((s.media_p + std_p * 0.7) * mf_p),
        walkin_lo: 0, walkin_med: 0, walkin_hi: 0,
      },
      cena: {
        lo:    Math.max(0, Math.round((s.media_c - std_c * 0.7) * mf_c)),
        media: med_c,
        hi:    Math.round((s.media_c + std_c * 0.7) * mf_c),
        walkin_lo: 0, walkin_med: 0, walkin_hi: 0,
      },
    });
  }
  return result;
}
export function isShiftFinished(currentHourMinutes: number, shiftStart: number, shiftEnd: number): boolean {
  return currentHourMinutes >= shiftEnd;
}
export function getMeteoItaliano(condition: string): string {
  const map: Record<string, string> = {
    'clear': 'Sereno',
    'sunny': 'Soleggiato',
    'partly-cloudy': 'Parzialmente nuvoloso',
    'partly_cloudy': 'Parzialmente nuvoloso',
    'cloudy': 'Nuvoloso',
    'overcast': 'Coperto',
    'rain': 'Pioggia',
    'rainy': 'Pioggia',
    'drizzle': 'Pioggerella',
    'snow': 'Neve',
    'snowy': 'Neve',
    'fog': 'Nebbia',
    'foggy': 'Nebbia',
    'wind': 'Ventoso',
    'windy': 'Ventoso',
    'thunderstorm': 'Temporale',
    'stormy': 'Temporale',
    'hail': 'Grandine',
  };
  return map[condition] ?? map[condition.toLowerCase()] ?? condition;
}
// ========== FINE ENGINE PREVISIONALE v2 ==========
