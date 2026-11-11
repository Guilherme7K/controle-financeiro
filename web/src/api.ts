import type {
  ApiError,
  AuthResponse,
  Budget,
  LoginInput,
  NewTransaction,
  RegisterInput,
  Summary,
  Transaction,
  User,
} from '../../shared/types';
const tokenKey = 'controle-financeiro-token';
let memoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
export function getToken() {
  try {
    return localStorage.getItem(tokenKey) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}
export function setToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  } catch {
    /* A sessão funciona enquanto a página estiver aberta. */
  }
}
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}
export class RequestError extends Error {
  constructor(public body: ApiError) {
    super(body.error);
    this.name = 'RequestError';
  }
}
async function request<T>(
  url: string,
  options: RequestInit = {},
  protectedCall = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (protectedCall && token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && protectedCall && token === getToken()) {
      setToken(null);
      unauthorizedHandler?.();
    }
    const body: ApiError = await response
      .json()
      .catch(() => ({ error: 'Não foi possível concluir a solicitação.' }));
    throw new RequestError(body);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
function json(method: string, data: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}
export function register(data: RegisterInput) {
  return request<AuthResponse>('/api/auth/register', json('POST', data), false);
}
export function login(data: LoginInput) {
  return request<AuthResponse>('/api/auth/login', json('POST', data), false);
}
export function demoLogin() {
  return request<AuthResponse>('/api/auth/demo', { method: 'POST' }, false);
}
export function getMe() {
  return request<User>('/api/auth/me');
}
export function listTransactions(month: string) {
  return request<Transaction[]>(`/api/transactions?month=${encodeURIComponent(month)}`);
}
export function createTransaction(data: NewTransaction) {
  return request<Transaction>('/api/transactions', json('POST', data));
}
export function updateTransaction(id: string, data: NewTransaction) {
  return request<Transaction>(
    `/api/transactions/${encodeURIComponent(id)}`,
    json('PUT', data),
  );
}
export function deleteTransaction(id: string) {
  return request<void>(`/api/transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
export function getSummary(month: string) {
  return request<Summary>(`/api/summary?month=${encodeURIComponent(month)}`);
}
export function listBudgets() {
  return request<Budget[]>('/api/budgets');
}
export function setBudget(category: string, limitCents: number) {
  return request<Budget>(
    `/api/budgets/${encodeURIComponent(category)}`,
    json('PUT', { limitCents }),
  );
}
export function removeBudget(category: string) {
  return request<void>(`/api/budgets/${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });
}
