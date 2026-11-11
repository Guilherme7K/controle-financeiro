import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthResponse } from '../../../shared/types';
import { demoLogin, login, register, RequestError } from '../api';
import { Wordmark } from './Wordmark';

type Props = { onAuthenticated: (response: AuthResponse) => void };
export function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  async function run(action: () => Promise<AuthResponse>) {
    setBusy(true);
    setErrors([]);
    try {
      onAuthenticated(await action());
    } catch (error) {
      setErrors(
        error instanceof RequestError
          ? [
              error.body.error,
              ...(error.body.issues ?? []).map(
                (i) =>
                  `${({ name: 'Nome', email: 'E-mail', password: 'Senha' } as Record<string, string>)[i.path] ?? i.path}: ${i.message}`,
              ),
            ]
          : ['Não foi possível conectar. Tente novamente.'],
      );
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems: string[] = [];
    if (mode === 'register' && !name.trim()) problems.push('Informe seu nome.');
    if (!email.trim()) problems.push('Informe seu e-mail.');
    if (!password) problems.push('Informe sua senha.');
    if (problems.length) {
      setErrors(problems);
      return;
    }
    void run(() =>
      mode === 'login' ? login({ email, password }) : register({ name, email, password }),
    );
  }
  return (
    <main className="auth-page">
      <section className="card auth-card">
        <div className="brand auth-brand">
          <Wordmark />
          <p className="auth-tagline">Suas contas do mês, anotadas em um só lugar.</p>
        </div>
        <div className="filter-segment auth-switch" role="group" aria-label="Acesso">
          {(
            [
              ['login', 'Entrar'],
              ['register', 'Criar conta'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={mode === value ? 'active' : ''}
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setErrors([]);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} noValidate>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-name">Nome</label>
              <input
                id="auth-name"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Senha</label>
            <div className="password-input">
              <input
                id="auth-password"
                type={visible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setVisible(!visible)}>
                {visible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          {errors.length > 0 && (
            <div className="alert" role="alert">
              <ul>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="submit-button" disabled={busy}>
            {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <button
          className="secondary-button demo-button"
          type="button"
          disabled={busy}
          onClick={() => void run(demoLogin)}
        >
          Entrar com conta de demonstração
        </button>
      </section>
    </main>
  );
}
