import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const origin = 'https://attendance.example.test';
const script = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');
const publicAsset = '/assets/index-Ab12cd34.js';

function basicResponse(headers: HeadersInit = {}, redirected = false) {
  const response = new Response('asset', { headers });
  Object.defineProperties(response, { type: { value: 'basic' }, redirected: { value: redirected } });
  return response;
}

function worker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const cache = { put: vi.fn().mockResolvedValue(undefined), match: vi.fn().mockResolvedValue(undefined) };
  const fetch = vi.fn().mockImplementation(async () => basicResponse());
  const skipWaiting = vi.fn();
  const claim = vi.fn();
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue(['afams-shell-v1', 'afams-shell-v2', 'unrelated']),
    delete: vi.fn().mockResolvedValue(true),
  };
  runInNewContext(script, {
    self: { location: { origin }, addEventListener: (name: string, fn: (event: unknown) => void) => listeners.set(name, fn), skipWaiting, clients: { claim } },
    caches, fetch, URL, Response,
  });
  const lifecycle = (name: string) => {
    const waitUntil = vi.fn();
    listeners.get(name)!({ waitUntil });
    return waitUntil.mock.calls[0][0];
  };
  const request = (path: string, init: RequestInit = {}, mode: RequestMode = 'same-origin') => {
    const req = new Request(new URL(path, origin), init);
    Object.defineProperty(req, 'mode', { value: mode });
    const respondWith = vi.fn();
    listeners.get('fetch')!({ request: req, respondWith });
    return respondWith.mock.calls[0]?.[0] as Promise<Response> | undefined;
  };
  return { cache, caches, fetch, skipWaiting, claim, lifecycle, request };
}

describe('offline public cache', () => {
  it('installs an anonymous shell and purges only previous AFAMS caches', async () => {
    const w = worker();
    await w.lifecycle('install');
    expect(w.fetch.mock.calls.map(([url, options]) => [url.pathname, options])).toEqual([
      ['/', { credentials: 'omit', redirect: 'error', cache: 'no-store' }],
      ['/manifest.json', { credentials: 'omit', redirect: 'error', cache: 'no-store' }],
    ]);
    expect(w.cache.put.mock.calls.map(([path]) => path)).toEqual(['/', '/manifest.json']);
    expect(w.skipWaiting).toHaveBeenCalledOnce();
    await w.lifecycle('activate');
    expect(w.caches.delete.mock.calls).toEqual([['afams-shell-v1']]);
    expect(w.claim).toHaveBeenCalledOnce();
  });

  it('does not store live navigation and uses only the named public cache when offline', async () => {
    const w = worker();
    const navigation = await w.request('/', { credentials: 'include' }, 'navigate');
    expect(navigation?.ok).toBe(true);
    expect(w.cache.put).not.toHaveBeenCalled();
    const publicShell = basicResponse();
    w.fetch.mockRejectedValueOnce(new TypeError('Offline'));
    w.cache.match.mockResolvedValueOnce(publicShell);
    expect(await w.request('/', { credentials: 'include' }, 'navigate')).toBe(publicShell);
    expect(w.caches.open).toHaveBeenCalledWith('afams-shell-v2');
    expect(w.cache.match).toHaveBeenCalledWith('/');
  });

  it('handles only same-origin, uncredentialed public asset requests', async () => {
    const w = worker();
    expect(w.request('/api')).toBeUndefined();
    expect(w.request('/api/reports/attendance')).toBeUndefined();
    expect(w.request('/assets/report.js')).toBeUndefined();
    expect(w.request(publicAsset + '?version=1')).toBeUndefined();
    expect(w.request('https://other.example.test' + publicAsset)).toBeUndefined();
    expect(w.request(publicAsset, { credentials: 'include' })).toBeUndefined();
    expect(w.request(publicAsset, { headers: { authorization: 'Bearer test-placeholder' } })).toBeUndefined();
    expect(w.request(publicAsset, { headers: { range: 'bytes=0-10' } })).toBeUndefined();
    expect(w.fetch).not.toHaveBeenCalled();
    await w.request(publicAsset);
    expect(w.fetch).toHaveBeenCalledWith(new URL(publicAsset, origin), { credentials: 'omit', redirect: 'error', cache: 'no-store' });
    expect(w.cache.put).toHaveBeenCalledWith(publicAsset, expect.any(Response));
  });

  it.each<HeadersInit>([
    { 'cache-control': 'Private, max-age=60' },
    { 'cache-control': 'NO-STORE' },
    { 'cache-control': 'no-cache' },
    { vary: 'Accept-Encoding, Cookie' },
    { vary: 'Authorization' },
    { vary: '*' },
  ])('does not persist a response with restrictive cache headers (%j)', async headers => {
    const w = worker();
    w.fetch.mockResolvedValue(basicResponse(headers));
    await w.lifecycle('install');
    await w.request(publicAsset);
    expect(w.cache.put).not.toHaveBeenCalled();
  });

  it('does not store redirects or block worker activation when the public shell is unavailable', async () => {
    const w = worker();
    w.fetch.mockRejectedValueOnce(new TypeError('Offline')).mockResolvedValueOnce(basicResponse({}, true));
    await w.lifecycle('install');
    expect(w.cache.put).not.toHaveBeenCalled();
    expect(w.skipWaiting).toHaveBeenCalledOnce();
  });
});
