import { randomBytes } from "node:crypto";
import { networkInterfaces } from "node:os";

export function makeToken(): string {
  return randomBytes(9).toString("hex");
}

export function lanAddresses(port: number): string[] {
  const out: string[] = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] ?? []) {
      if (ni.family === "IPv4" && !ni.internal) {
        out.push(`http://${ni.address}:${port}`);
      }
    }
  }
  return out;
}
