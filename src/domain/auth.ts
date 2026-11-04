import { z } from 'zod';
import { ProjectSchema } from './schemas';

/**
 * Accounts (Phase 12). Login = phone (+998…) or email — same rules as server/lib/Auth.php normalizeLogin.
 * Form + API response schemas; every server answer is validated before use.
 */
export type LoginKind = 'phone' | 'email';

export function normalizeLogin(raw: string): { kind: LoginKind; value: string } | null {
  const s = raw.trim();
  if (s.includes('@')) {
    const email = s.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 190
      ? { kind: 'email', value: email }
      : null;
  }
  let digits = s.replace(/\D+/g, '');
  if (digits.length === 9) digits = `998${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? { kind: 'phone', value: `+${digits}` } : null;
}

export const AUTH_CODES = [
  'name_required',
  'login_invalid',
  'password_short',
  'login_taken',
  'bad_credentials',
  'too_many_attempts',
  'network',
  'server',
] as const;
export type AuthCode = (typeof AUTH_CODES)[number];

export const LoginFormSchema = z.object({
  login: z.string().refine((v) => normalizeLogin(v) !== null, { error: 'login_invalid' }),
  password: z.string().min(8, { error: 'password_short' }).max(200, { error: 'password_short' }),
});
export const RegisterFormSchema = LoginFormSchema.extend({
  name: z.string().trim().min(1, { error: 'name_required' }).max(120, { error: 'name_required' }),
});
export type LoginForm = z.infer<typeof LoginFormSchema>;
export type RegisterForm = z.infer<typeof RegisterFormSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  role: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = z.object({ user: UserSchema });
export const SyncOkSchema = z.object({ revision: z.number().int().positive(), ownerId: z.string() });
export const SyncConflictSchema = z.object({ error: z.literal('conflict'), project: ProjectSchema });
export const PullResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  revisions: z.record(z.string(), z.number().int()),
});
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
  retryAfter: z.number().optional(),
});
