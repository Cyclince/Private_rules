import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { AppVariables, Env } from '../types';
import { error } from './response';
import { id, slugify } from './slug';

const COOKIE_NAME = 'private_rules_session';
const maxAgeSeconds = 60 * 60 * 24 * 14;

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signed(secret: string, sessionId: string) {
  return `${sessionId}.${await hmac(secret, sessionId)}`;
}

async function verify(secret: string, value?: string) {
  if (!value?.includes('.')) return null;
  const [sessionId, signature] = value.split('.');
  const expected = await hmac(secret, sessionId);
  return signature === expected ? sessionId : null;
}

export async function createSession(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const sessionId = id('sess');
  const created = new Date();
  const expires = new Date(created.getTime() + maxAgeSeconds * 1000);
  await c.env.DB.prepare('INSERT INTO sessions (id, expires_at, created_at) VALUES (?, ?, ?)')
    .bind(sessionId, expires.toISOString(), created.toISOString())
    .run();
  setCookie(c, COOKIE_NAME, await signed(c.env.SESSION_SECRET!, sessionId), {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function destroySession(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  const sessionId = await currentSessionId(c);
  if (sessionId) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  setCookie(c, COOKIE_NAME, '', { path: '/', maxAge: 0, httpOnly: true });
}

export async function currentSessionId(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  if (!c.env.SESSION_SECRET) return null;
  const sessionId = await verify(c.env.SESSION_SECRET, getCookie(c, COOKIE_NAME));
  if (!sessionId) return null;
  const row = await c.env.DB.prepare('SELECT id FROM sessions WHERE id = ? AND expires_at > ?')
    .bind(sessionId, new Date().toISOString())
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function isAuthenticated(c: Context<{ Bindings: Env; Variables: AppVariables }>) {
  return Boolean(await currentSessionId(c));
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (c, next) => {
  const sessionId = await currentSessionId(c);
  if (!sessionId) return error('请先登录。', 401);
  c.set('sessionId', sessionId);
  await next();
};

export async function checkPassword(env: Env, password: string) {
  return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD;
}

export function authConfigured(env: Env) {
  return Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET);
}

export function safeFileName(file: string) {
  return /^[A-Za-z0-9_.-]+$/.test(file) && !file.includes('..') && !file.includes('/') && !file.includes('\\');
}

export function tokenMatches(env: Env, token: string) {
  return Boolean(env.RULE_TOKEN) && token === env.RULE_TOKEN;
}

export function safeSlug(value: string) {
  return slugify(value).toLowerCase();
}
