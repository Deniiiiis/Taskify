// src/api/auth.ts
import { BASE_URL } from '../api/src/config';
console.log('🔗 API_URL =', BASE_URL);

type Json = Record<string, unknown>;

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  [k: string]: unknown;
}

type BodyPayload =
  | { kind: 'json'; json: unknown }
  | { kind: 'text'; text: string }
  | { kind: 'empty' };

function toErrorMessage(payload: BodyPayload, status: number): string {
  if (
    payload.kind === 'json' &&
    payload.json &&
    typeof payload.json === 'object'
  ) {
    const j = payload.json as NestErrorBody;
    const m = j.message;
    if (Array.isArray(m)) return m.join('\n');
    if (typeof m === 'string' && m.trim()) return m;
    if (typeof j.error === 'string' && j.error.trim()) return j.error;
  }
  if (payload.kind === 'text' && payload.text.trim()) {
    // rozpoznaj ngrok HTML stránku
    if (payload.text.includes('ngrok') && payload.text.includes('error')) {
      return 'Tunel je aktívny, ale backend nie je dostupný (ngrok 8012/502). Skontroluj, že beží http://127.0.0.1:3000 a že ngrok forwarduje na tento port.';
    }
    return payload.text.trim().slice(0, 500);
  }
  return `HTTP ${status}`;
}

async function parseBody(res: Response): Promise<BodyPayload> {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const json: unknown = await res.json();
      return { kind: 'json', json };
    }
    const text: string = await res.text();
    return { kind: 'text', text };
  } catch {
    return { kind: 'empty' };
  }
}

async function post<T>(path: string, body: Json): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.log('➡️ POST', url);

  // timeout – nech to nevisí pri tuneli
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }

  const payload = await parseBody(res);

  if (!res.ok) {
    console.log('❌ API error', path, res.status, payload);
    throw new Error(toErrorMessage(payload, res.status));
  }

  if (payload.kind === 'json') return payload.json as T;
  throw new Error('Neočakávaná odpoveď servera (text).');
}

// ---------- Typy ----------
export type ApiUser = {
  id: string;
  email: string;
  emailVerifiedAt?: string | null;
};

// ---------- REGISTRÁCIA + VERIFIKÁCIA E-MAILU ----------
export function register(name: string, email: string, password: string) {
  return post<{ ok: true; user: ApiUser }>('/auth/register', {
    name,
    email,
    password,
  });
}
export function verifyEmail(email: string, code: string) {
  return post<{ ok: true; accessToken: string; user: ApiUser }>(
    '/auth/verify-email',
    { email, code },
  );
}
export function resendVerifyEmail(email: string) {
  return post<{ ok: true }>('/auth/verify-email/resend', { email });
}

// ---------- OTP LOGIN ----------
export function requestOtp(email: string) {
  return post<{ ok: true }>('/auth/otp/request', { email });
}
export function verifyOtp(email: string, code: string) {
  return post<{ ok: true; user: { id: string; email: string } }>(
    '/auth/otp/verify',
    { email, code },
  );
}

// ---------- RESET HESLA ----------
export function requestPasswordReset(email: string) {
  return post<{ ok: true }>('/auth/password/forgot', { email });
}
export function confirmPasswordReset(args: {
  email: string;
  token: string;
  newPassword: string;
  name?: string;
}) {
  return post<{ ok: true }>('/auth/password/reset', args);
}
//login volanie
export function login(email: string, password: string) {
  return post<{
    ok: true;
    user: ApiUser;
    accessToken: string;
    refreshToken: string;
  }>('/auth/login', { email, password });
}
