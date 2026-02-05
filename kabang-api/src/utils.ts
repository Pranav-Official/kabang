export const BANG_REGEX = /^!(\w+)\s*(.*)$/

export function parseIdParam(param: string): number | null {
  const id = parseInt(param, 10)
  return isNaN(id) ? null : id
}

export function buildSearchUrl(template: string, query: string): string {
  return template.replace('{query}', encodeURIComponent(query).replace(/%20/g, '+'))
}
