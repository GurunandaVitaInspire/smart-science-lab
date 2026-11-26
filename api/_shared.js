// Helpers shared by the /api functions (files starting with "_" are not routes on Vercel).

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function send(res, status, data, type = 'application/json') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}

export const header = (req, name) => {
  const v = req.headers?.[name];
  return Array.isArray(v) ? v[0] : v || '';
};
