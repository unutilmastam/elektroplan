'use client';

import { useState, type FormEvent } from 'react';
import { TextField } from '@/components/common/TextField';
import { Button } from '@/components/ui/button';
import { LoginFormSchema, RegisterFormSchema, type AuthCode } from '@/domain/auth';
import { uz } from '@/i18n/uz';
import { ApiFailure, NetworkError } from '@/infra/api';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { usePwaStore } from '@/store/pwaStore';

type Mode = 'login' | 'register';
type Errors = Partial<Record<'name' | 'login' | 'password' | 'form', AuthCode>>;

const known = (c: string): AuthCode =>
  (Object.keys(uz.auth.errors) as AuthCode[]).includes(c as AuthCode) ? (c as AuthCode) : 'server';

/** Kirish / Yangi akkaunt — phone or email + password. Validated with zod first, then the server. */
export function AuthForm({ onDone }: { onDone: (name: string) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [values, setValues] = useState({ name: '', login: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const online = usePwaStore((s) => s.online);
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = (mode === 'login' ? LoginFormSchema : RegisterFormSchema).safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0] as keyof Errors;
        next[k] ??= known(i.message);
      }
      return setErrors(next);
    }
    setErrors({});
    setBusy(true);
    try {
      const auth = useAuthStore.getState();
      const user =
        mode === 'login'
          ? await auth.login(values.login, values.password)
          : await auth.register(values.name.trim(), values.login, values.password);
      onDone(user.name);
    } catch (err) {
      if (err instanceof ApiFailure) {
        const fields = Object.entries(err.fields) as Array<[keyof Errors, string]>;
        setErrors(
          fields.length
            ? Object.fromEntries(fields.map(([k, c]) => [k, known(c)]))
            : { form: known(err.code) },
        );
      } else setErrors({ form: err instanceof NetworkError ? 'network' : 'server' });
    } finally {
      setBusy(false);
    }
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setErrors({});
      }}
      className={cn(
        'h-11 flex-1 rounded-[10px] text-[15px] font-medium transition-colors',
        mode === m ? 'bg-primary text-white' : 'text-text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  );
  const msg = (k: keyof Errors) => (errors[k] ? uz.auth.errors[errors[k]!] : undefined);

  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      className="flex flex-col gap-4"
      aria-label={uz.auth.title}
    >
      <div role="tablist" className="flex gap-1 rounded-[12px] border border-white/10 bg-[#0a1222] p-1">
        {tab('login', uz.auth.loginTab)}
        {tab('register', uz.auth.registerTab)}
      </div>
      {mode === 'register' ? (
        <TextField
          label={uz.auth.name}
          placeholder={uz.auth.namePlaceholder}
          autoComplete="name"
          value={values.name}
          onChange={set('name')}
          error={msg('name')}
        />
      ) : null}
      <TextField
        label={uz.auth.loginLabel}
        placeholder={uz.auth.loginPlaceholder}
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        value={values.login}
        onChange={set('login')}
        error={msg('login')}
      />
      <TextField
        label={uz.auth.password}
        hint={mode === 'register' ? uz.auth.passwordHint : undefined}
        type="password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        value={values.password}
        onChange={set('password')}
        error={msg('password')}
      />
      {errors.form ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[14px] text-[#ffb4b4]"
        >
          {uz.auth.errors[errors.form]}
        </p>
      ) : null}
      {!online ? <p className="text-[14px] text-[#fcd27b]">{uz.auth.offlineLogin}</p> : null}
      <Button type="submit" variant="primary" size="lg" disabled={busy || !online}>
        {busy ? uz.auth.busy : mode === 'login' ? uz.auth.submitLogin : uz.auth.submitRegister}
      </Button>
    </form>
  );
}
