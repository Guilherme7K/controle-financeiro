import { useState } from 'react';
import type { Summary } from '../../../shared/types';
import { buildDonutSegments } from '../charts';
import { formatCents } from '../money';

type Props = { summary: Summary; colors: Map<string, string> };

export function CategoryDonut({ summary, colors }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const items = summary.expensesByCategory.filter((item) => item.totalCents > 0);
  const segments = buildDonutSegments(items, summary.expenseCents);

  return (
    <section className="card category-card">
      <div className="section-heading">
        <div>
          <h2>Despesas por categoria</h2>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="empty category-empty">Nenhuma despesa neste mês.</p>
      ) : (
        <>
          <div className="donut-wrap">
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label="Distribuição de despesas por categoria"
            >
              <circle className="donut-track" cx="60" cy="60" r="46" />
              {segments.map((segment) => (
                <circle
                  key={segment.category}
                  className="donut-segment"
                  cx="60"
                  cy="60"
                  r="46"
                  stroke={colors.get(segment.category)}
                  strokeDasharray={`${Math.max(0, segment.length - Math.min(2, segment.length * 0.12))} ${segment.circumference}`}
                  strokeDashoffset={-segment.offset}
                  opacity={active && active !== segment.category ? 0.25 : 1}
                  transform="rotate(-90 60 60)"
                />
              ))}
            </svg>
            <div className="donut-center">
              <span>Saídas</span>
              <strong>{formatCents(summary.expenseCents)}</strong>
            </div>
          </div>
          <ul className="legend">
            {items.map((item) => (
              <li key={item.category}>
                <button
                  type="button"
                  className="legend-row"
                  onMouseEnter={() => setActive(item.category)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(item.category)}
                  onBlur={() => setActive(null)}
                >
                  <span className="legend-name">
                    <i style={{ backgroundColor: colors.get(item.category) }} />
                    {item.category}
                  </span>
                  <span className="legend-value">
                    {formatCents(item.totalCents)}{' '}
                    <small>
                      {Math.round((item.totalCents / summary.expenseCents) * 100)}%
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
