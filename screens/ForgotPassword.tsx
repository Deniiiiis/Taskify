import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

type Mode = 'magic' | 'reset';

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('magic');     // 'magic' | 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');                // 6-digit
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [step, setStep] = useState<1 | 2>(1);          // 1=pošli, 2=over

  // ---- API stubs (TODO napojiť na backend) ----
  const sendCode = async () => {
    // POST /auth/forgot (body: { email, mode }) -> 200
    // mode: 'magic' = login-only, 'reset' = reset password
    // server vygeneruje kód (hash+exp), pošle e-mail (Resend)
    setStep(2);
  };

  const verifyMagic = async () => {
    // POST /auth/magic-login (body: { email, code })
    // -> vráti JWT/session a usera
    // navigation.reset(...) na hlavnú app
  };

  const verifyReset = async () => {
    // POST /auth/reset-password (body: { email, code, newPassword })
    // po úspechu: navigation.replace('Login')
  };

  const canSend = email.trim().length > 3 && email.includes('@');

  const canVerifyMagic = code.length >= 6;
  const canVerifyReset = code.length >= 6 && newPass.length >= 8 && newPass === confirmPass;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>Zabudol si heslo?</Text>

          {/* prepínač režimov */}
          <View style={s.toggleRow}>
            <Pressable style={[s.toggleBtn, mode==='magic' && s.toggleBtnOn]} onPress={() => { setMode('magic'); setStep(1); }}>
              <Text style={[s.toggleTxt, mode==='magic' && s.toggleTxtOn]}>Prihlásiť kódom</Text>
            </Pressable>
            <Pressable style={[s.toggleBtn, mode==='reset' && s.toggleBtnOn]} onPress={() => { setMode('reset'); setStep(1); }}>
              <Text style={[s.toggleTxt, mode==='reset' && s.toggleTxtOn]}>Resetovať heslo</Text>
            </Pressable>
          </View>

          {/* Krok 1: zadaj e‑mail a pošli kód */}
          {step === 1 && (
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

              <Pressable style={[s.primaryBtn, !canSend && s.btnDisabled]} onPress={sendCode} disabled={!canSend}>
                <Text style={s.primaryText}>
                  {mode === 'magic' ? 'Pošli prihlasovací kód' : 'Pošli kód na reset hesla'}
                </Text>
              </Pressable>

              <Text style={s.hint}>
                Pošleme 6‑miestny kód na tvoj e‑mail. Platnosť: 10 minút.
              </Text>
            </>
          )}

          {/* Krok 2: overenie kódu */}
          {step === 2 && (
            <>
              <View style={s.inputWrap}>
                <Text style={s.label}>Overovací kód</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={s.input}
                />
              </View>

              {mode === 'reset' && (
                <>
                  <View style={s.inputWrap}>
                    <Text style={s.label}>Nové heslo</Text>
                    <TextInput value={newPass} onChangeText={setNewPass} placeholder="••••••••" secureTextEntry style={s.input} />
                  </View>
                  <View style={s.inputWrap}>
                    <Text style={s.label}>Potvrdiť heslo</Text>
                    <TextInput value={confirmPass} onChangeText={setConfirmPass} placeholder="••••••••" secureTextEntry style={s.input} />
                  </View>
                </>
              )}

              {mode === 'magic' ? (
                <Pressable style={[s.primaryBtn, !canVerifyMagic && s.btnDisabled]} onPress={verifyMagic} disabled={!canVerifyMagic}>
                  <Text style={s.primaryText}>Prihlásiť</Text>
                </Pressable>
              ) : (
                <Pressable style={[s.primaryBtn, !canVerifyReset && s.btnDisabled]} onPress={verifyReset} disabled={!canVerifyReset}>
                  <Text style={s.primaryText}>Nastaviť nové heslo</Text>
                </Pressable>
              )}

              <Pressable onPress={() => setStep(1)} style={s.secondaryBtn}>
                <Text style={s.link}>Poslať kód znova</Text>
              </Pressable>
            </>
          )}

          {/* Späť na login */}
          <View style={s.bottomRow}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={s.linkStrong}>Späť na prihlásenie</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f1b2b' },
  wrap: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#152238', padding: 20, borderRadius: 20 },
  title: { textAlign: 'center', color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 14 },

  toggleRow: { flexDirection: 'row', backgroundColor: '#0e1726', borderRadius: 12, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: '#23324a' },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleBtnOn: { backgroundColor: '#1b2740' },
  toggleTxt: { color: '#9fb0c8', fontWeight: '600' },
  toggleTxtOn: { color: 'white' },

  inputWrap: { marginBottom: 12 },
  label: { color: '#9fb0c8', marginBottom: 6, fontSize: 13 },
  input: { backgroundColor: '#0e1726', borderWidth: 1, borderColor: '#23324a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: 'white', fontSize: 16 },

  primaryBtn: { backgroundColor: '#6d5efc', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },

  secondaryBtn: { marginTop: 10, alignItems: 'center' },
  hint: { marginTop: 10, color: '#9fb0c8', fontSize: 12 },

  bottomRow: { marginTop: 14, alignItems: 'center' },
  link: { color: '#8bb7ff' },
  linkStrong: { color: '#8bb7ff', fontWeight: '700' },
});
