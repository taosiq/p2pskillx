import { importPKCS8, SignJWT } from 'jose';

// Minimal Firestore REST client using a service account (admin access).
// Used only by the Worker; the app itself talks to Firestore under security rules.

let cachedToken = null; // { token, exp }

async function accessToken(env) {
  if (cachedToken && cachedToken.exp - 60 > Date.now() / 1000) return cachedToken.token;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const key = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!res.ok) throw new Error(`Service account token failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cachedToken.token;
}

// ---------- value encoding ----------

export function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  throw new Error(`Cannot encode ${typeof v}`);
}

export const encodeFields = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, encode(v)]));

export function decode(v) {
  if (!v) return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('referenceValue' in v) return v.referenceValue;
  return null;
}

export const decodeFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));

// Field path segments that aren't simple identifiers must be back-quoted.
const quote = (seg) => (/^[A-Za-z_][A-Za-z_0-9]*$/.test(seg) ? seg : '`' + seg.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`');
export const fieldPath = (...segments) => segments.map(quote).join('.');

/** Build nested `fields` for an update of the given segment paths. */
export function nestedFields(entries) {
  const root = {};
  for (const [segments, value] of entries) {
    let node = root;
    segments.slice(0, -1).forEach((s) => {
      node[s] = node[s] || { __nested: {} };
      node = node[s].__nested;
    });
    node[segments[segments.length - 1]] = { __value: value };
  }
  const build = (n) =>
    Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v.__nested ? { mapValue: { fields: build(v.__nested) } } : encode(v.__value)]));
  return build(root);
}

// ---------- client ----------

export class Firestore {
  constructor(env) {
    this.env = env;
    this.project = env.FIREBASE_PROJECT_ID;
    this.base = `https://firestore.googleapis.com/v1/projects/${this.project}/databases/(default)/documents`;
  }

  name(path) {
    return `projects/${this.project}/databases/(default)/documents/${path}`;
  }

  async req(url, init = {}) {
    const token = await accessToken(this.env);
    const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message || `Firestore ${res.status}`);
      err.status = res.status;
      err.firestoreStatus = data?.error?.status;
      throw err;
    }
    return data;
  }

  /** Get a document: { data, updateTime } or null. */
  async get(path, transaction) {
    const q = transaction ? `?transaction=${encodeURIComponent(transaction)}` : '';
    const doc = await this.req(`${this.base}/${path}${q}`);
    return doc ? { data: decodeFields(doc.fields), updateTime: doc.updateTime } : null;
  }

  async beginTransaction() {
    const r = await this.req(`${this.base}:beginTransaction`, { method: 'POST', body: JSON.stringify({ options: { readWrite: {} } }) });
    return r.transaction;
  }

  async rollback(transaction) {
    await this.req(`${this.base}:rollback`, { method: 'POST', body: JSON.stringify({ transaction }) }).catch(() => {});
  }

  /** Commit raw writes (see helpers below), optionally inside a transaction. */
  async commit(writes, transaction) {
    return this.req(`${this.base}:commit`, { method: 'POST', body: JSON.stringify({ writes, ...(transaction ? { transaction } : {}) }) });
  }

  /** Run fn(tx) with retries on contention. fn returns { writes, result }. */
  async runTransaction(fn, attempts = 4) {
    for (let i = 0; i < attempts; i++) {
      const tx = await this.beginTransaction();
      try {
        const { writes, result } = await fn(tx);
        if (writes?.length) await this.commit(writes, tx);
        else await this.rollback(tx);
        return result;
      } catch (e) {
        await this.rollback(tx);
        const retryable = e.firestoreStatus === 'ABORTED' || e.status === 409;
        if (!retryable || i === attempts - 1) throw e;
        await new Promise((r) => setTimeout(r, 100 * 2 ** i));
      }
    }
    return null;
  }

  /** Structured query on a collection. filters: [[field, op, value]]. */
  async query(collection, filters = [], { limit, select } = {}) {
    const where = filters.length
      ? {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(([f, op, v]) => ({ fieldFilter: { field: { fieldPath: f }, op, value: encode(v) } })),
          },
        }
      : undefined;
    const body = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        ...(where ? { where } : {}),
        ...(limit ? { limit } : {}),
        ...(select ? { select: { fields: select.map((f) => ({ fieldPath: f })) } } : {}),
      },
    };
    const rows = await this.req(`${this.base}:runQuery`, { method: 'POST', body: JSON.stringify(body) });
    return (rows || []).filter((r) => r.document).map((r) => ({ path: r.document.name.split('/documents/')[1], data: decodeFields(r.document.fields) }));
  }

  /** COUNT(*) aggregation. */
  async count(collection, filters = []) {
    const body = {
      structuredAggregationQuery: {
        structuredQuery: {
          from: [{ collectionId: collection }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: filters.map(([f, op, v]) => ({ fieldFilter: { field: { fieldPath: f }, op, value: encode(v) } })),
            },
          },
        },
        aggregations: [{ alias: 'n', count: {} }],
      },
    };
    const rows = await this.req(`${this.base}:runAggregationQuery`, { method: 'POST', body: JSON.stringify(body) });
    return Number(rows?.[0]?.result?.aggregateFields?.n?.integerValue || 0);
  }
}

// ---------- write builders ----------

/**
 * Update specific fields. fields: [[segments[], value]]; transforms: [{ path: segments[], increment | append | remove | serverTime }]
 * precondition: { exists: bool } | { updateTime }
 */
export const DELETE = Symbol('delete');

export function updateWrite(fs, path, fields = [], transforms = [], precondition) {
  // A field listed in the mask but absent from `fields` is deleted.
  const w = {
    update: { name: fs.name(path), fields: nestedFields(fields.filter(([, v]) => v !== DELETE)) },
    updateMask: { fieldPaths: fields.map(([segs]) => fieldPath(...segs)) },
  };
  if (transforms.length) {
    w.updateTransforms = transforms.map((t) => {
      const fp = fieldPath(...t.path);
      if (t.increment != null) return { fieldPath: fp, increment: encode(t.increment) };
      if (t.append) return { fieldPath: fp, appendMissingElements: { values: t.append.map(encode) } };
      if (t.remove) return { fieldPath: fp, removeAllFromArray: { values: t.remove.map(encode) } };
      return { fieldPath: fp, setToServerValue: 'REQUEST_TIME' };
    });
  }
  if (precondition) w.currentDocument = precondition;
  return w;
}

/** Create a whole document (fails if it exists unless overwrite). */
export function setWrite(fs, path, data, { mustNotExist = false } = {}) {
  return { update: { name: fs.name(path), fields: encodeFields(data) }, ...(mustNotExist ? { currentDocument: { exists: false } } : {}) };
}

export const deleteWrite = (fs, path) => ({ delete: fs.name(path) });
