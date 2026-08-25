import { deriveKey, encryptJSON, decryptJSON, newSalt } from "@/lib/crypto"

export interface VaultEntry {
  id: string
  title: string
  username: string
  password: string
  url: string
  note: string
  updatedAt: number
}

export interface VaultData {
  entries: VaultEntry[]
}

const DATA_KEY = "deriva-vault-v1"
const SALT_KEY = "deriva-vault-salt-v1"

function readSalt(): Uint8Array {
  try {
    const raw = localStorage.getItem(SALT_KEY)
    if (raw) return new Uint8Array(JSON.parse(raw))
  } catch {}
  const salt = newSalt()
  try { localStorage.setItem(SALT_KEY, JSON.stringify([...salt])) } catch {}
  return salt
}

export function hasVault(): boolean {
  try { return localStorage.getItem(DATA_KEY) !== null } catch { return false }
}

export async function createVault(password: string, entries: VaultEntry[] = []): Promise<void> {
  const salt = readSalt()
  const key = await deriveKey(password, salt)
  const { iv, cipher } = await encryptJSON(key, { entries })
  localStorage.setItem(DATA_KEY, JSON.stringify({ iv, cipher }))
}

export async function unlockVault(password: string): Promise<VaultData> {
  const salt = readSalt()
  const key = await deriveKey(password, salt)
  const raw = localStorage.getItem(DATA_KEY)
  if (!raw) throw new Error("No vault found")
  const { iv, cipher } = JSON.parse(raw)
  const data = await decryptJSON(key, iv, cipher) as VaultData
  return data
}

export async function saveVault(password: string, data: VaultData): Promise<void> {
  const salt = readSalt()
  const key = await deriveKey(password, salt)
  const { iv, cipher } = await encryptJSON(key, data)
  localStorage.setItem(DATA_KEY, JSON.stringify({ iv, cipher }))
}

export function deleteVault(): void {
  try {
    localStorage.removeItem(DATA_KEY)
    localStorage.removeItem(SALT_KEY)
  } catch {}
}

export function newEntryId(): string {
  return `v${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
