import { useState } from 'react';
import type { Transaction } from '../../../shared/types';
import { formatDay } from '../dates';
import { formatCents } from '../money';

type Props = {
  transactions: Transaction[];
  colors: Map<string, string>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: Transaction) => void;
};
type Filter = 'all' | 'income' | 'expense';

function normalizeSearch(value: string): string {
  // A decomposição remove acentos para que a busca aceite as duas grafias.
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function TransactionList({ transactions, colors, onDelete, onEdit }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const query = normalizeSearch(search.trim());
  const filtered = transactions.filter(
    (item) =>
      (filter === 'all' || item.type === filter) &&
      normalizeSearch(`${item.description} ${item.category}`).includes(query),
  );
  const dates = [...new Set(filtered.map((item) => item.date))].sort().reverse();

  return (
    <section className="card list-card">
      <div className="list-heading">
        <div>
          <h2>
            Lançamentos <span className="count">{transactions.length}</span>
          </h2>
        </div>
      </div>
      <div className="list-tools">
        <div className="filter-segment" role="group" aria-label="Filtrar lançamentos">
          {(
            [
              ['all', 'Todos'],
              ['income', 'Entradas'],
              ['expense', 'Saídas'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-field">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            type="search"
            aria-label="Buscar lançamentos"
            placeholder="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {transactions.length === 0 ? (
        <p className="empty list-empty">Nenhum lançamento neste mês.</p>
      ) : filtered.length === 0 ? (
        <p className="empty list-empty">Nenhum resultado para este filtro.</p>
      ) : (
        <div className="day-groups">
          {dates.map((date) => {
            const items = filtered.filter((item) => item.date === date);
            const net = items.reduce(
              (total, item) =>
                total + (item.type === 'income' ? item.amountCents : -item.amountCents),
              0,
            );
            return (
              <div className="day-group" key={date}>
                <div className="day-heading">
                  <span>{formatDay(date)}</span>
                  <strong>
                    {net > 0 ? '+ ' : net < 0 ? '− ' : ''}
                    {formatCents(Math.abs(net))}
                  </strong>
                </div>
                <ul className="transactions">
                  {items.map((item) => {
                    const color =
                      item.type === 'income'
                        ? 'var(--income)'
                        : (colors.get(item.category) ?? 'var(--accent)');
                    return (
                      <li key={item.id}>
                        <span
                          className="category-badge"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${color} 16%, var(--surface))`,
                          }}
                        >
                          {item.category.trim().charAt(0).toLocaleUpperCase('pt-BR')}
                        </span>
                        <div className="transaction-info">
                          <strong>{item.description}</strong>
                          <span>{item.category}</span>
                        </div>
                        <strong
                          className={`transaction-amount ${item.type === 'income' ? 'income' : 'expense'}`}
                        >
                          {item.type === 'income' ? '+' : '−'}{' '}
                          {formatCents(item.amountCents)}
                        </strong>
                        <button
                          className="remove edit"
                          type="button"
                          aria-label={`Editar ${item.description}`}
                          onClick={() => onEdit(item)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="m4 16 1-4L14 3l3 3-9 9-4 1ZM12 5l3 3" />
                          </svg>
                        </button>
                        <button
                          className="remove"
                          type="button"
                          aria-label={`Remover ${item.description}`}
                          onClick={() => void onDelete(item.id)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6M8.5 9v4m3-4v4" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
