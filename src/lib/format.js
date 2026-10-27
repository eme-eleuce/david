export function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Fecha corta fija (sin Intl) para listados. */
export function formatDate(date) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sept",
    "oct",
    "nov",
    "dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Formato fijo (sin Intl) para evitar mismatches de hydration. */
export function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sept",
    "oct",
    "nov",
    "dic",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "a. m." : "p. m.";
  return `${day} ${month} ${year}, ${h12}:${minutes} ${ampm}`;
}
