// Minimal className combiner (shadcn-style `cn`) without external deps.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
