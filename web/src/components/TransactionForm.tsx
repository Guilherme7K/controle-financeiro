import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewTransaction, Transaction, TransactionType } from '../../../shared/types';
import { RequestError } from '../api';
import { parseAmountToCents } from '../money';

const fieldNames: Record<string, string> = {
  description: 'Descrição',
  amountCents: 'Valor',
  type: 'Tipo',
  category: 'Categoria',
  date: 'Data',
};
const categories = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Salário', 'Outros'];

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

type Props = {
  onCreate: (data: NewTransaction) => Promise<void>;
  editing: Transaction | null;
  onCancel: () => void;
};

export function TransactionForm({ onCreate, editing, onCancel }: Props) {
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount] = useState(
    editing
      ? new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(editing.amountCents / 100)
      : '',
  );
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [date, setDate] = useState(editing?.date ?? today());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseAmountToCents(amount);
    const problems: string[] = [];
    if (!description.trim()) problems.push('Informe uma descrição.');
    if (cents === null || cents <= 0)
      problems.push('Informe um valor válido maior que zero.');
    if (!category.trim()) problems.push('Informe uma categoria.');
    if (!date) problems.push('Informe uma data.');
    if (problems.length || cents === null) {
      setErrors(problems);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onCreate({
        description: description.trim(),
        amountCents: cents,
        type,
        category: category.trim(),
        date,
      });
      setDescription('');
      setAmount('');
    } catch (error) {
      if (error instanceof RequestError) {
        setErrors([
          error.body.error,
          ...(error.body.issues ?? []).map(
            (issue) => `${fieldNames[issue.path] ?? issue.path}: ${issue.message}`,
          ),
        ]);
      } else {
        setErrors(['Não foi possível salvar o lançamento. Tente novamente.']);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card form-card">
      <div className="section-heading">
        <div>
          <h2>{editing ? 'Editar lançamento' : 'Novo lançamento'}</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="type-field">
          <legend>Tipo</legend>
          <div className="type-segment">
            <label>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
              />
              <span>Saída</span>
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
              />
              <span>Entrada</span>
            </label>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="description">Descrição</label>
          <input
            id="description"
            value={description}
            maxLength={120}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Supermercado"
          />
        </div>
        <div className="field">
          <label htmlFor="amount">Valor</label>
          <div className="amount-input">
            <span>R$</span>
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="category">Categoria</label>
          <input
            id="category"
            list="categories"
            maxLength={40}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Ex.: Alimentação"
          />
          <datalist id="categories">
            {categories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <div className="chips" aria-label="Sugestões de categoria">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? 'selected' : ''}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="date">Data</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        {errors.length > 0 && (
          <div className="alert" role="alert">
            <ul>
              {errors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <button className="submit-button" type="submit" disabled={saving}>
          {saving
            ? 'Salvando...'
            : editing
              ? 'Salvar alterações'
              : 'Adicionar lançamento'}{' '}
        </button>
        {editing && (
          <button
            type="button"
            className="secondary-button cancel-button"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </form>
    </section>
  );
}
