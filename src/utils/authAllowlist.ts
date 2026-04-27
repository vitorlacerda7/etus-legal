const ALLOWED_DOMAINS = [
  'etus.com.br',
  'plusdin.com.br',
  'brius.com.br',
  'bhaz.com.br',
]

export function isEmailAllowed(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return ALLOWED_DOMAINS.some(
    (d) => domain === d || domain.endsWith('.' + d),
  )
}
