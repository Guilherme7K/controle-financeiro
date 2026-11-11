import type { Summary, Transaction } from '../../../shared/types';
import { formatMonth } from '../dates';
import { formatCents } from '../money';
import { DailyChart } from './DailyChart';

type Props = { summary: Summary; transactions: Transaction[]; month: string };

export function BalanceHero({ summary, transactions, month }: Props) {
  const { incomeCents, expenseCents, balanceCents } = summary;
  const percentage =
    incomeCents > 0 ? Math.round((Math.abs(balanceCents) / incomeCents) * 100) : 0;
  const progress =
    incomeCents > 0 ? Math.min(100, (expenseCents / incomeCents) * 100) : 0;

  return (
    <section className="hero" aria-label="Resumo do mês">
      <div className="hero-main">
        <p className="hero-label">Saldo de {formatMonth(month).toLowerCase()}</p>
        <strong className={`hero-balance${balanceCents >= 0 ? ' positive' : ''}`}>
          {formatCents(balanceCents)}
        </strong>
        <div className="hero-stats">
          <div className="hero-stat">
            <span>Entradas</span>
            <strong>
              <span className="income" aria-hidden="true">
                +
              </span>{' '}
              {formatCents(incomeCents)}
            </strong>
          </div>
          <div className="hero-stat">
            <span>Saídas</span>
            <strong>
              <span className="expense" aria-hidden="true">
                −
              </span>{' '}
              {formatCents(expenseCents)}
            </strong>
          </div>
        </div>
        {incomeCents > 0 && (
          <div className="savings">
            <p>
              {balanceCents >= 0
                ? `Você guardou ${percentage}% do que entrou`
                : `Você gastou ${percentage}% a mais do que entrou`}
            </p>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Despesas em relação às entradas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <DailyChart transactions={transactions} month={month} />
    </section>
  );
}
