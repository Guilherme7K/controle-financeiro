import { useEffect, useRef, useState } from 'react';
import type {
  AuthResponse,
  Budget,
  NewTransaction,
  Summary,
  Transaction,
  User,
} from '../../shared/types';
import {
  createTransaction,
  deleteTransaction,
  getMe,
  getSummary,
  getToken,
  listBudgets,
  listTransactions,
  removeBudget,
  setBudget,
  setToken,
  setUnauthorizedHandler,
  updateTransaction,
} from './api';
import { buildCategoryColors } from './categoryColors';
import { currentMonth } from './dates';
import { AuthScreen } from './components/AuthScreen';
import { BalanceHero } from './components/BalanceHero';
import { BudgetCard } from './components/BudgetCard';
import { CategoryDonut } from './components/CategoryDonut';
import { TopBar } from './components/TopBar';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';

type Theme = 'light' | 'dark';
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // A preferência do sistema continua disponível.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(() => Boolean(getToken()));
  const [editing, setEditing] = useState<Transaction | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function clearSession() {
    setToken(null);
    setUser(null);
    setTransactions([]);
    setSummary(null);
    setBudgets([]);
    setEditing(null);
    setError('');
    setRestoring(false);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* O tema permanece nesta sessão. */
    }
  }, [theme]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (getToken()) {
      getMe()
        .then((result) => {
          if (active) setUser(result);
        })
        .catch(() => {
          if (active) {
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          if (active) setRestoring(false);
        });
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user)
      return () => {
        active = false;
      };
    if (!month) {
      setLoading(false);
      setError('Selecione um mês.');
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError('');
    Promise.all([listTransactions(month), getSummary(month), listBudgets()])
      .then(([items, totals, limits]) => {
        if (active) {
          setTransactions(items);
          setSummary(totals);
          setBudgets(limits);
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os dados. Tente novamente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month, revision, user]);

  function authenticated(response: AuthResponse) {
    setToken(response.token);
    setUser(response.user);
  }
  async function handleSave(data: NewTransaction) {
    if (editing) {
      await updateTransaction(editing.id, data);
      setEditing(null);
    } else {
      await createTransaction(data);
    }
    setRevision((value) => value + 1);
  }
  async function handleDelete(id: string) {
    try {
      setError('');
      await deleteTransaction(id);
      if (editing?.id === id) setEditing(null);
      setRevision((value) => value + 1);
    } catch {
      setError('Não foi possível remover o lançamento. Tente novamente.');
    }
  }
  function handleEdit(item: Transaction) {
    setEditing(item);
    if (window.matchMedia('(max-width: 900px)').matches) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  async function handleBudget(category: string, limit: number) {
    await setBudget(category, limit);
    setRevision((value) => value + 1);
  }
  async function handleRemoveBudget(category: string) {
    await removeBudget(category);
    setRevision((value) => value + 1);
  }

  if (restoring)
    return (
      <main className="container session-loading" role="status">
        <span className="visually-hidden">Carregando dados...</span>
        <div className="skeleton skeleton-hero" />
      </main>
    );
  if (!user) return <AuthScreen onAuthenticated={authenticated} />;

  const colors = buildCategoryColors(summary?.expensesByCategory ?? []);
  const firstLoad = !summary && (loading || !error);
  return (
    <main className="container">
      <TopBar
        month={month}
        onMonthChange={setMonth}
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
        name={user.name}
        onLogout={clearSession}
      />
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {firstLoad && (
        <div role="status">
          <span className="visually-hidden">Carregando dados...</span>
          <div className="skeleton skeleton-hero" />
        </div>
      )}
      {summary && (
        <BalanceHero
          summary={summary}
          transactions={transactions}
          month={summary.month ?? month}
        />
      )}
      <div className="content-grid">
        <div className="form-area" ref={formRef}>
          <TransactionForm
            key={editing?.id ?? 'new'}
            editing={editing}
            onCancel={() => setEditing(null)}
            onCreate={handleSave}
          />
        </div>
        {summary && (
          <div className="donut-area">
            <CategoryDonut summary={summary} colors={colors} />
            <BudgetCard
              budgets={budgets}
              expenses={summary.expensesByCategory}
              onSet={handleBudget}
              onRemove={handleRemoveBudget}
            />
          </div>
        )}
        {summary && (
          <div className="list-area">
            <TransactionList
              transactions={transactions}
              colors={colors}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>
        )}
        {firstLoad && (
          <div className="card skeleton-list list-area" aria-hidden="true">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
          </div>
        )}
      </div>
    </main>
  );
}
