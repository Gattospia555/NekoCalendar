/**
 * Utilità di data indipendenti dall'interfaccia.
 * Usano l'ora locale del dispositivo (fuso orario di sistema).
 */

/**
 * Mezzanotte locale della prossima ricorrenza annuale (es. Natale = mese 12, giorno 25).
 *
 * Se oggi è proprio quel giorno restituisce la mezzanotte di oggi (già passata):
 * così il countdown mostra "È arrivato il giorno!" fino a sera, poi passa all'anno dopo.
 */
export function nextAnnualDate(nowMs: number, month: number, day: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month deve essere un intero da 1 a 12");
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError("day deve essere un intero da 1 a 31");
  }
  if (!Number.isFinite(nowMs)) throw new RangeError("nowMs deve essere un numero finito");

  const now = new Date(nowMs);
  for (let offset = 0; offset <= 8; offset += 1) {
    const year = now.getFullYear() + offset;
    const candidate = new Date(year, month - 1, day);
    // Salta le date inesistenti in quell'anno (es. 29 febbraio negli anni non bisestili).
    if (candidate.getMonth() !== month - 1) continue;
    const endOfDay = new Date(year, month - 1, day + 1);
    if (nowMs < endOfDay.getTime()) return candidate.getTime();
  }
  throw new RangeError("Data annuale non valida");
}
