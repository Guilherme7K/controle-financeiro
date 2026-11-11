import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Budget, CategoryTotal } from '../../../shared/types';
import { RequestError } from '../api';
import { calculateBudgets } from '../budgets';
import { expenseCategories } from '../categories';
import { formatCents, parseAmountToCents } from '../money';
type Props = {
  budgets: Budget[];
  expenses: CategoryTotal[];
  onSet: (category: string, limit: number) => Promise<void>;
  onRemove: (category: string) => Promise<void>;
};
export function BudgetCard({ budgets, expenses, onSet, onRemove }: Props) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!category.trim() || cents === null || cents <= 0) {
      setError('Informe uma categoria e um limite válido maior que zero.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onSet(category.trim(), cents);
      setCategory('');
      setAmount('');
    } catch (err) {
      setError(
        err instanceof RequestError
          ? [err.body.error, ...(err.body.issues ?? []).map((i) => i.message)].join(': ')
          : 'Não foi possível salvar o orçamento.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(categoryName: string) {
    setError('');
    try {
      await onRemove(categoryName);
    } catch {
      setError('Não foi possível remover o orçamento.');
    }
  }
  return (
    <section className="card budget-card">
      <div className="section-heading">
        <h2>Orçamento do mês</h2>
      </div>
      {budgets.length === 0 ? (
        <p className="empty">
          Defina um limite por categoria para acompanhar seus gastos no mês.
        </p>
      ) : (
        <div className="budget-list">
          {calculateBudgets(budgets, expenses).map((item) => (
            <div className="budget-row" key={item.category}>
              <div className="budget-heading">
                <strong>{item.category}</strong>
                <button
                  className="budget-remove"
                  type="button"
                  aria-label={`Remover orçamento de ${item.category}`}
                  onClick={() => void remove(item.category)}
                >
                  Remover
                </button>
              </div>
              <p>
                {formatCents(item.spent)} de {formatCents(item.limitCents)}
              </p>
              <div
                className={`budget-track ${item.status}`}
                role="progressbar"
                aria-label={`Orçamento de ${item.category}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round(item.percent))}
              >
                <div style={{ width: `${Math.min(100, item.percent)}%` }} />
              </div>
              {item.status === 'over' && (
                <p className="budget-over">
                  Estourou em {formatCents(item.spent - item.limitCents)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <form className="budget-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="budget-category">Categoria</label>
          <input
            id="budget-category"
            list="budget-categories"
            maxLength={40}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex.: Alimentação"
          />
          {/* Orçamento é limite de gasto, então só sugere categorias de saída. */}
          <datalist id="budget-categories">
            {expenseCategories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="budget-amount">Limite</label>
          <div className="amount-input budget-amount">
            <span>R$</span>
            <input
              id="budget-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="submit-button" disabled={busy}>
          {busy ? 'Salvando...' : 'Definir'}
        </button>
      </form>
    </section>
  );
}
