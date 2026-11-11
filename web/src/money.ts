const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

// Formato brasileiro: ponto separa milhares e vírgula separa centavos ("1.234,56", "1.000").
const brazilianFormat = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;
// Formato com ponto decimal, como em "123.45".
const dotDecimalFormat = /^\d+\.\d{1,2}$/;

export function parseAmountToCents(text: string): number | null {
  const value = text.trim();

  let normalized: string;
  if (brazilianFormat.test(value)) {
    normalized = value.replace(/\./g, '').replace(',', '.');
  } else if (dotDecimalFormat.test(value)) {
    normalized = value;
  } else {
    return null;
  }

  // Monta os centavos com inteiros, sem multiplicar número quebrado por 100.
  const [whole = '0', fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}
