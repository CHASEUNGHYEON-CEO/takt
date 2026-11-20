// Serverless share links: the whole analysis (case + design + assumptions) is compressed into the URL hash.
// Nothing is uploaded anywhere — the link itself is the data. Same seed ⇒ the recipient sees identical results.

const toB64u = bytes => {
  let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64u = str => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

export async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toB64u(new Uint8Array(await new Response(stream).arrayBuffer()));
}

export async function decodeShare(str) {
  const stream = new Blob([fromB64u(str)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}

/** Short stable fingerprint so the same shared case is not duplicated on repeated opens. */
export function fingerprint(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
