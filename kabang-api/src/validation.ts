export interface CreateKabangBody {
  name: string
  bang: string
  url: string
  category?: string | null
  isDefault?: boolean
}

export type UpdateKabangBody = Partial<CreateKabangBody>

export function validateCreateBody(body: unknown): { valid: true; data: CreateKabangBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' }
  }

  const b = body as Record<string, unknown>

  if (!b.name || typeof b.name !== 'string') {
    return { valid: false, error: 'name is required and must be a string' }
  }
  if (!b.bang || typeof b.bang !== 'string') {
    return { valid: false, error: 'bang is required and must be a string' }
  }
  if (!b.url || typeof b.url !== 'string') {
    return { valid: false, error: 'url is required and must be a string' }
  }

  return {
    valid: true,
    data: {
      name: b.name,
      bang: b.bang,
      url: b.url,
      category: b.category === undefined ? undefined : (b.category as string | null),
      isDefault: b.isDefault === true,
    },
  }
}

export function validateUpdateBody(body: unknown): { valid: true; data: UpdateKabangBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' }
  }

  const b = body as Record<string, unknown>
  const data: UpdateKabangBody = {}

  if (b.name !== undefined) {
    if (typeof b.name !== 'string') return { valid: false, error: 'name must be a string' }
    data.name = b.name
  }
  if (b.bang !== undefined) {
    if (typeof b.bang !== 'string') return { valid: false, error: 'bang must be a string' }
    data.bang = b.bang
  }
  if (b.url !== undefined) {
    if (typeof b.url !== 'string') return { valid: false, error: 'url must be a string' }
    data.url = b.url
  }
  if (b.category !== undefined) {
    data.category = b.category as string | null
  }
  if (b.isDefault !== undefined) {
    data.isDefault = b.isDefault === true
  }

  return { valid: true, data }
}
