// src/config.ts
import { Platform } from 'react-native';

const RAW = process.env.EXPO_PUBLIC_API_URL ?? ''; // napr. "https://xxx.ngrok-free.app"
const PREFIX = process.env.EXPO_PUBLIC_API_PREFIX ?? ''; // napr. "/api" (ak máš globalPrefix)

function guessLocalApi() {
  // Android emulator potrebuje 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

const trimRight = (s: string) => s.replace(/\/+$/, '');
const trimLeft = (s: string) => s.replace(/^\/+/, '');

export const API_URL = trimRight(RAW || guessLocalApi()); // bez trailing slasha
export const API_PREFIX = PREFIX ? `/${trimLeft(PREFIX)}` : ''; // prázdne alebo "/api"
export const BASE_URL = `${API_URL}${API_PREFIX}`; // finálna báza pre fetch

// Debug do konzoly pri štarte
console.log('🔗 API_URL =', API_URL);
console.log('🔗 API_PREFIX =', API_PREFIX || '(none)');
console.log('🔗 BASE_URL =', BASE_URL);
