import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Forgot'>;

type Mode = 'code' | 'reset';   // code = prihlásenie kódom, reset = zmena hesla
type Step = 'enterEmail' | 'enterCode' | 'setPassword' | 'done';

export default function ForgotFlow({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('code');
  const [step, setStep] = useState<Step>('enterEmail');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // jednoduchý countdown „Znova poslať“
  const [canResendAt, setCanResendAt] = useState<number>(0);
  const now = Date.now();
  const remainingSec = Math.max(0, Math.ceil((canResendAt - now) / 1000));

  useEffect(() => {
    const t = setInterval(() => { /* force re-render pre countdown */ }, 500);
    return () => clearInterval(t);
  }, []);

  const canSubmitEmail = useMemo(() => /\S+@\S+\.\S+/.test(email) && !busy, [email, busy]);
  const canSubmitCode = useMemo(() => code.trim().length >= 6 && !busy, [code, busy]);
  const canSubmitPassword = useMemo(
    () => password.length >= 8 && password === confirm && !busy,
    [password, confirm, busy]
  );

  // --- ACTIONS (API stuby) ---

  const requestCode = async () => {
    setBusy(true); setError(null);
    try {
      // TODO: POST /auth/forgot: { email, mode }  -> send code
      // mode: 'code' | 'reset' na serveri - rozlíšenie "template" e‑mailu
      await fakeWait();
      setCanResendAt(Date.now() + 60_000); // lock 60s na resend
      setStep('enterCode');
    } catch (e: any) {
      setError('Nepodarilo sa odoslať kód. Skús to znova.');
    } finally { setBusy(false); }
  };

  const verifyCodeAndLogin = async () => {
    setBusy(true); setError(null);
    try {
      // TODO: POST /auth/verify-code-login: { email, code }
      await fakeWait();
      setStep('done');
      // napr. navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      setError('Kód je neplatný alebo expirovaný.');
    } finally { setBusy(false); }
  };

  const verifyCodeForReset = async () => {
    setBusy(true); setError(null);
    try {
      // TODO: POST /auth/verify-code-begin-reset: { email, code } -> vráti resetToken
      await fakeWait();
      setStep('setPassword');
    } catch {
      setError('Kód je neplatný alebo expirovaný.');
    } finally { setBusy(false); }
  };

  const setNewPassword = async () => {
    setBusy(true); setError(null);
    try {
      // TODO: POST /auth/reset-password: { email, code or resetToken, newPassword }
      await fakeWait();
      setStep('done');
    } catch {
      setError('Nepodarilo sa nastaviť nové heslo.');
    } finally { setBusy(false); }
  };

  const resend = async () => {
    if (remainingSec > 0) return;
    await requestCode();
  };

  // --- UI ---

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.card}>

        {/* Heading */}
        <Text style={s.title}>Zabudnuté heslo</Text>
        <Text style={s.sub}>
          Vyber si, či chceš jednorazové prihlásenie kódom alebo reset hesla.
        </Text>

        {/* Mode switch */}
        <View style={s.switchRow}>
          <Pressable style={[s.switchBtn, mode==='code' && s.switchBtnOn]} onPress={() => { setMode('code'); setStep('enterEmail'); }}>
            <Text style={[s.switchText, mode==='code' && s.switchTextOn]}>Prihlásiť kódom</Text>
          </Pressable>
          <Pressable style={[s.switchBtn, mode==='reset' && s.switchBtnOn]} onPress={() => { setMode('reset'); setStep('enterEmail'); }}>
            <Text style={[s.switchText, mode==='reset' && s.switchTextOn]}>Resetovať heslo</Text>
          </Pressable>
        </View>

        {step === 'enterEmail' && (
          <>
            <View style={s.inputWrap}>
              <Text style={s.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tvoj@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                style={s.input}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable style={[s.primaryBtn, !canSubmitEmail && s.disabled]} disabled={!canSubmitEmail} onPress={requestCode}>
              <Text style={s.primaryText}>Poslať kód</Text>
            </Pressable>

            <View style={s.bottomRow}>
              <Pressable onPress={() => navigation.goBack()}><Text style={s.link}>Späť na prihlásenie</Text></Pressable>
            </View>
          </>
        )}

        {step === 'enterCode' && (
          <>
            <View style={s.inputWrap}>
              <Text style={s.label}>Overovací kód</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={8}
                style={s.input}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            {mode === 'code' ? (
              <Pressable style={[s.primaryBtn, !canSubmitCode && s.disabled]} disabled={!canSubmitCode} onPress={verifyCodeAndLogin}>
                <Text style={s.primaryText}>Prihlásiť sa</Text>
              </Pressable>
            ) : (
              <Pressable style={[s.primaryBtn, !canSubmitCode && s.disabled]} disabled={!canSubmitCode} onPress={verifyCodeForReset}>
                <Text style={s.primaryText}>Pokračovať</Text>
              </Pressable>
            )}

            <View style={s.bottomRow}>
              <Text style={s.muted}>Nedostal si kód? </Text>
              <Pressable disabled={remainingSec>0} onPress={resend}>
                <Text style={[s.link, remainingSec>0 && s.muted]}>
                  {remainingSec>0 ? `Znova poslať (${remainingSec}s)` : 'Poslať znova'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'setPassword' && (
          <>
            <View style={s.inputWrap}>
              <Text style={s.label}>Nové heslo</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry style={s.input} />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.label}>Potvrdiť heslo</Text>
              <TextInput value={confirm} onChangeText={setConfirm} placeholder="••••••••" secureTextEntry style={s.input} />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable style={[s.primaryBtn, !canSubmitPassword && s.disabled]} disabled={!canSubmitPassword} onPress={setNewPassword}>
              <Text style={s.primaryText}>Nastaviť heslo</Text>
            </Pressable>
          </>
        )}

        {step === 'done' && (
          <>
            <Text style={s.done}>Hotovo! Teraz sa môžeš prihlásiť.</Text>
            <Pressable style={s.primaryBtn} onPress={() => navigation.replace('Login')}>
              <Text style={s.primaryText}>Pokračovať</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// simulácia requestu
const fakeWait = (ms = 650) => new Promise(res => setTimeout(res, ms));

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f1b2b', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#152238', padding: 20, borderRadius: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: '700' },
  sub: { color: '#9fb0c8', marginTop: 6, marginBottom: 14 },

  switchRow: { flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 2 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#23324a', alignItems: 'center', backgroundColor: '#0e1726' },
  switchBtnOn: { backgroundColor: '#24334d', borderColor: '#3b82f6' },
  switchText: { color: '#c7d2e5', fontWeight: '600' },
  switchTextOn: { color: 'white' },

  inputWrap: { marginBottom: 12 },
  label: { color: '#9fb0c8', marginBottom: 6, fontSize: 13 },
  input: { backgroundColor: '#0e1726', borderWidth: 1, borderColor: '#23324a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: 'white', fontSize: 16 },

  primaryBtn: { backgroundColor: '#6d5efc', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.6 },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  muted: { color: '#9fb0c8' },
  link: { color: '#8bb7ff', fontWeight: '700' },

  error: { color: '#ff8a8a', marginTop: 6 },
  done: { color: '#c7ffd6', marginBottom: 12, fontSize: 16, textAlign: 'center' },
});
