/**
 * Formatea una fecha a dd/mm/yyyy
 * Para date-only strings (yyyy-mm-dd) reformatea directamente
 * Para datetimes con T extrae solo la parte de fecha
 */
export function formatDate(dateStr: string): string {
  const datePart = dateStr.split("T")[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}
