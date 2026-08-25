// AES-GCM vault cryptography built on the Web Crypto API.
// All data stays on-device; the master password never leaves memory.

const enc = new TextEncoder()
const dec = new TextDecoder()

function toB64(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function newSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(password) as BufferSource, "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encryptJSON(key: CryptoKey, data: unknown): Promise<{ iv: string; cipher: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(JSON.stringify(data)) as BufferSource)
  return { iv: toB64(iv), cipher: toB64(new Uint8Array(cipher)) }
}

export async function decryptJSON(key: CryptoKey, ivB64: string, cipherB64: string): Promise<unknown> {
  const iv = fromB64(ivB64)
  const cipher = fromB64(cipherB64)
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource)
  return JSON.parse(dec.decode(plain))
}

export function generatePassword(length = 16): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?"
  const out = new Uint8Array(length)
  crypto.getRandomValues(out)
  let s = ""
  for (let i = 0; i < length; i++) s += chars[out[i] % chars.length]
  return s
}
