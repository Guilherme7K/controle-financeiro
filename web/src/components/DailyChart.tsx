import type { Transaction } from '../../../shared/types';
import { dailyExpenses } from '../charts';
import { currentMonth } from '../dates';
import { formatCents } from '../money';

type Props = { transactions: Transaction[]; month: string };

export function DailyChart({ transactions, month }: Props) {
  const totals = dailyExpenses(transactions, month);
  const largest = Math.max(0, ...totals);
  const today = month === currentMonth() ? new Date().getDate() : 0;
  const barWidth = 6;
  const gap = 3;
  const width = totals.length * (barWidth + gap) - gap;

  return (
    <figure className="daily-chart">
      <figcaption>
        <span>Gastos por dia</span>
        <span>{String(totals.length).padStart(2, '0')} dias</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} 88`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gastos por dia no mês selecionado"
      >
        {totals.map((total, index) => {
          const height = largest > 0 ? Math.max(2, (total / largest) * 82) : 2;
          return (
            <rect
              key={index}
              className={`daily-bar${index + 1 === today ? ' is-today' : ''}`}
              x={index * (barWidth + gap)}
              y={88 - height}
              width={barWidth}
              height={height}
              rx="1"
            >
              <title>{`${String(index + 1).padStart(2, '0')}/${month.slice(5)}: ${formatCents(total)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="chart-axis">
        <span>01</span>
        <span>{totals.length}</span>
      </div>
    </figure>
  );
}
