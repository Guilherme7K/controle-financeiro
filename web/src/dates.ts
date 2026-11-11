export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function localDate(value: string): Date {
  // A data local evita a mudança de dia causada pela interpretação em UTC.
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftMonth(value: string, amount: number): string {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(value: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(localDate(`${value}-01`));
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

export function formatDay(value: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(localDate(value));
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}
