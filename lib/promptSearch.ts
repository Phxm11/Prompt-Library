/**
 * Quote the complete PostgREST value, then let the client URL-encode it.
 * Keep commas/parentheses in the search text instead of interpreting them as
 * filter syntax. Escape SQL LIKE metacharacters before PostgREST quoting.
 * https://docs.postgrest.org/en/stable/references/api/url_grammar.html
 */
export function promptSearchFilter(keyword: string): string {
  const pattern = `%${keyword.replace(/[%_\\]/g, ch => `\\${ch}`)}%`
  const quoted = `"${pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  return ['title', 'description', 'prompt_text'].map(column => `${column}.ilike.${quoted}`).join(',')
}
