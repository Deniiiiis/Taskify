// src/backend/api/http.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api/src/config';

type RefreshJson = {
  ok?: boolean;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
};

async function getTokens() {
  const entries = await AsyncStorage.multiGet(['accessToken', 'refreshToken']);
  const access = entries.find(([k]) => k === 'accessToken')?.[1] ?? null;
  const refresh = entries.find(([k]) => k === 'refreshToken')?.[1] ?? null;
  return { access, refresh };
}

async function refreshTokens() {
  const { refresh } = await getTokens();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  // bezpečné parsovanie bez `any` a bez zbytočných "as string"
  const raw: unknown = await res.json().catch(() => ({}));

  const asObj = (v: unknown): Record<string, unknown> =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

  const o = asObj(raw);

  const ok = o.ok === true;
  const accessToken =
    typeof o.accessToken === 'string' ? o.accessToken : undefined;
  const refreshToken =
    typeof o.refreshToken === 'string' ? o.refreshToken : undefined;
  const message = typeof o.message === 'string' ? o.message : undefined;

  if (!res.ok || !ok || !accessToken || !refreshToken) {
    throw new Error(message ?? 'Refresh failed');
  }

  await AsyncStorage.multiSet([
    ['accessToken', accessToken],
    ['refreshToken', refreshToken], // rotujeme aj refresh
  ]);

  const data: RefreshJson = { ok, accessToken, refreshToken, message };
  return data;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const { access } = await getTokens();
  const headers = new Headers(init.headers || {});
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (!headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');

  let res = await fetch(`${API_URL}${input}`, { ...init, headers });
  if (res.status !== 401) return res;

  // 401 -> pokús sa o refresh
  try {
    await refreshTokens();

    const { access: newAccess } = await getTokens();
    const retryHeaders = new Headers(init.headers || {});
    if (newAccess) retryHeaders.set('Authorization', `Bearer ${newAccess}`);
    if (!retryHeaders.has('Content-Type'))
      retryHeaders.set('Content-Type', 'application/json');

    res = await fetch(`${API_URL}${input}`, { ...init, headers: retryHeaders });
    return res;
  } catch {
    // refresh zlyhal -> odhlásiť usera
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'auth_user',
    ]);
    throw new Error('Session expired');
  }
}
