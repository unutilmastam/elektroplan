'use client';

import { useState, type FormEvent } from 'react';
import { TextField } from '@/components/common/TextField';
import { Button } from '@/components/ui/button';
import { PasswordFormSchema, type AuthCode } from '@/domain/auth';
import { uz } from '@/i18n/uz';
import { api, ApiFailure, NetworkError } from '@/infra/api';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

type Field = 'current' | 'password' | 'repeat' | 'form';
const known = (c: string): AuthCode =>
  (Object.keys(uz.auth.errors) as AuthCode[]).includes(c as AuthCode) ? (c as AuthCode) : 'server';

/** Current (or temporary) password + new password twice. Used on the account page and after an admin reset. */
export function ChangePasswordForm({
  temporary = false,
  onDone,
}: {
  temporary?: boolean;
  onDone?: () => void;
}) {
  const [v, setV] = useState({ current: '', password: '', repeat: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, AuthCode>>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = PasswordFormSchema.safeParse(v);
    if (!r.success) {
      const next: Partial<Record<Field, AuthCode>> = {};
      for (const i of r.error.issues) next[i.path[0] as Field] ??= known(i.message);
      return setErrors(next);
    }
    setErrors({});
    setBusy(true);
    try {
      await useAuthStore.getState().setUser(await api.changePassword(v.current, v.password));
      useUiStore.getState().notify(uz.password.saved);
      setV({ current: '', password: '', repeat: '' });
      onDone?.();
    } catch (err) {
      if (err instanceof ApiFailure && Object.keys(err.fields).length)
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, c]) => [k, known(c)])));
      else
        setErrors({
          form:
            err instanceof NetworkError ? 'network' : known(err instanceof ApiFailure ? err.code : 'server'),
        });
    } finally {
      setBusy(false);
    }
  };
  const msg = (k: Field) => (errors[k] ? uz.auth.errors[errors[k]!] : undefined);
  return (
    <form
      onSubmit={(e) => void submit(e)}
      noValidate
      className="flex flex-col gap-3"
      aria-label={uz.password.title}
    >
      <TextField
        label={temporary ? uz.password.currentTemp : uz.password.current}
        type={temporary ? 'text' : 'password'}
        autoComplete="current-password"
        autoCapitalize="none"
        value={v.current}
        onChange={set('current')}
        error={msg('current')}
      />
      <TextField
        label={uz.password.next}
        hint={uz.auth.passwordHint}
        type="password"
        autoComplete="new-password"
        value={v.password}
        onChange={set('password')}
        error={msg('password')}
      />
      <TextField
        label={uz.password.repeat}
        type="password"
        autoComplete="new-password"
        value={v.repeat}
        onChange={set('repeat')}
        error={msg('repeat')}
      />
      {errors.form ? (
        <p role="alert" className="text-[14px] text-[#ffb4b4]">
          {uz.auth.errors[errors.form]}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {busy ? uz.auth.busy : uz.password.save}
      </Button>
    </form>
  );
}
