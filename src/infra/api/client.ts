import {
  ApiErrorSchema,
  PullResponseSchema,
  SyncConflictSchema,
  SyncOkSchema,
  UserResponseSchema,
  type User,
} from '@/domain/auth';
import type { Conflict } from '@/domain/merge';
import type { Project } from '@/domain/types';
import type { z } from 'zod';

/** PHP API client (server/index.php). Same origin, httpOnly cookie session. Every answer is zod-validated. */
const BASE = '/api';

export class NetworkError extends Error {
  constructor() {
    super('network');
  }
}
export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly fields: Record<string, string> = {},
    public readonly detail = '',
  ) {
    super(code);
  }
}

async function request(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json', 'X-Elektroplan': '1' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  let json: unknown = null;
  try {
    json = await r.json();
  } catch {
    // e.g. the static host answered with HTML (no PHP): treat as server error below
  }
  return { status: r.status, json };
}

function parse<S extends z.ZodType>(schema: S, status: number, json: unknown): z.infer<S> {
  const ok = schema.safeParse(json);
  if (ok.success) return ok.data;
  return fail(status, json);
}

/** Non-2xx answer -> ApiFailure with the server's error code (or 'server' when the body is not ours). */
function fail(status: number, json: unknown): never {
  const e = ApiErrorSchema.safeParse(json);
  throw e.success
    ? new ApiFailure(status, e.data.error, e.data.fields, e.data.message)
    : new ApiFailure(status, 'server');
}

async function call<S extends z.ZodType>(schema: S, method: 'GET' | 'POST', path: string, body?: unknown) {
  const { status, json } = await request(method, path, body);
  if (status < 200 || status >= 300) fail(status, json);
  return parse(schema, status, json);
}

export type SyncResult =
  { kind: 'ok'; revision: number; ownerId: string } | { kind: 'conflict'; project: Project };

export const api = {
  me: async (): Promise<User | null> => {
    const { status, json } = await request('GET', '/auth/me');
    if (status === 401) return null;
    return parse(UserResponseSchema, status, json).user;
  },
  login: async (login: string, password: string): Promise<User> =>
    (await call(UserResponseSchema, 'POST', '/auth/login', { login, password })).user,
  register: async (name: string, login: string, password: string): Promise<User> =>
    (await call(UserResponseSchema, 'POST', '/auth/register', { name, login, password })).user,
  logout: async (): Promise<void> => {
    await request('POST', '/auth/logout', {});
  },
  sync: async (body: {
    project: Project;
    baseRevision: number;
    ops: unknown[];
    conflicts: Conflict[];
  }): Promise<SyncResult> => {
    const { status, json } = await request('POST', '/sync', body);
    if (status === 409) return { kind: 'conflict', project: parse(SyncConflictSchema, status, json).project };
    if (status !== 200) fail(status, json);
    return { kind: 'ok', ...parse(SyncOkSchema, status, json) };
  },
  pull: async (have: Record<string, number>) => call(PullResponseSchema, 'POST', '/pull', { have }),
};
export type Api = typeof api;
