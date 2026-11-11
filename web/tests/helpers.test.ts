import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../shared/types';
import { buildDonutSegments, dailyExpenses } from '../src/charts';
import { formatMonth, localDate, shiftMonth } from '../src/dates';
import { parseAmountToCents } from '../src/money';

describe('parseAmountToCents', () => {
  it.each([
    ['123', 12300],
    ['123,45', 12345],
    ['123,4', 12340],
    ['123.45', 12345],
    ['1.234,56', 123456],
    ['1.000', 100000],
    ['1.000.000', 100000000],
    [' 50 ', 5000],
    ['0,10', 10],
    ['19,99', 1999],
  ])('converte "%s" em %i centavos', (text, cents) => {
    expect(parseAmountToCents(text)).toBe(cents);
  });

  it.each(['', 'abc', '-5', '1,234', '12.3.4', '1,2,3', '10,', 'R$ 10'])(
    'rejeita "%s"',
    (text) => {
      expect(parseAmountToCents(text)).toBeNull();
    },
  );
});

describe('datas', () => {
  it('avança e volta meses, virando o ano', () => {
    expect(shiftMonth('2026-11', 1)).toBe('2026-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('interpreta a data como local, sem voltar um dia', () => {
    const date = localDate('2026-11-09');
    expect(date.getDate()).toBe(9);
    expect(date.getMonth()).toBe(10);
  });

  it('formata o mês em português com inicial maiúscula', () => {
    expect(formatMonth('2026-11')).toBe('Novembro de 2026');
  });
});

describe('gráficos', () => {
  function expense(date: string, amountCents: number): Transaction {
    return {
      id: date + amountCents,
      description: 'Teste',
      amountCents,
      type: 'expense',
      category: 'Geral',
      date,
      createdAt: '2026-11-10T12:00:00.000Z',
    };
  }

  it('soma os gastos de cada dia do mês e ignora entradas e outros meses', () => {
    const totals = dailyExpenses(
      [
        expense('2026-11-01', 1000),
        expense('2026-11-01', 500),
        expense('2026-11-30', 200),
        expense('2026-10-15', 9999),
        { ...expense('2026-11-02', 7777), type: 'income' },
      ],
      '2026-11',
    );

    expect(totals).toHaveLength(30);
    expect(totals[0]).toBe(1500);
    expect(totals[1]).toBe(0);
    expect(totals[29]).toBe(200);
  });

  it('conta 29 dias em fevereiro de ano bissexto', () => {
    expect(dailyExpenses([], '2028-02')).toHaveLength(29);
  });

  it('divide a rosca em arcos proporcionais que fecham a circunferência', () => {
    const segments = buildDonutSegments(
      [
        { category: 'A', totalCents: 7500 },
        { category: 'B', totalCents: 2500 },
      ],
      10000,
    );
    const circumference = segments[0]!.circumference;

    expect(segments[0]!.length).toBeCloseTo(circumference * 0.75);
    expect(segments[1]!.offset).toBeCloseTo(circumference * 0.75);
    expect(segments[0]!.length + segments[1]!.length).toBeCloseTo(circumference);
  });

  it('não divide por zero quando não há despesas', () => {
    const segments = buildDonutSegments([{ category: 'A', totalCents: 0 }], 0);
    expect(segments[0]!.length).toBe(0);
  });
});

describe('orçamentos', () => {
  it('calcula gasto, percentual e estado sem perder categorias sem gastos', async () => {
    const { calculateBudgets } = await import('../src/budgets');
    expect(
      calculateBudgets(
        [
          { category: 'A', limitCents: 100 },
          { category: 'B', limitCents: 100 },
          { category: 'C', limitCents: 100 },
          { category: 'D', limitCents: 100 },
        ],
        [
          { category: 'A', totalCents: 79 },
          { category: 'B', totalCents: 80 },
          { category: 'C', totalCents: 150 },
        ],
      ),
    ).toEqual([
      { category: 'A', limitCents: 100, spent: 79, percent: 79, status: 'normal' },
      { category: 'B', limitCents: 100, spent: 80, percent: 80, status: 'warning' },
      { category: 'C', limitCents: 100, spent: 150, percent: 150, status: 'over' },
      { category: 'D', limitCents: 100, spent: 0, percent: 0, status: 'normal' },
    ]);
  });
});
