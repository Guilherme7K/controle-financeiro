import { formatMonth, shiftMonth } from '../dates';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  name: string;
  onLogout: () => void;
};

export function TopBar({
  month,
  onMonthChange,
  onToggleTheme,
  theme,
  name,
  onLogout,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
          <rect x="1" y="1" width="30" height="30" rx="9" fill="currentColor" />
          <path
            d="M8 21V16M13 21V11M18 21V14M23 21V8"
            stroke="white"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
        <h1>Controle financeiro</h1>
      </div>
      <div className="topbar-actions">
        <div className="user-actions">
          <span>Olá, {name.split(/\s+/)[0]}</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Sair
          </button>
        </div>
        <nav className="month-nav" aria-label="Navegação por mês">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            ‹
          </button>
          <span aria-live="polite">{formatMonth(month)}</span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            ›
          </button>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          aria-label="Alternar tema"
          onClick={onToggleTheme}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 15.4A8.3 8.3 0 0 1 8.6 4a8.3 8.3 0 1 0 11.4 11.4Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
