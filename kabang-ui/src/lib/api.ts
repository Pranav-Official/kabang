// API client for kabang-api
// Use empty string for relative paths (goes through Vite proxy), full URL for production
const API_URL = import.meta.env.VITE_API_URL || ''

export interface Kabang {
  id: number
  name: string
  bang: string
  url: string
  category: string | null
  isDefault: boolean
  createdAt: string
}

export interface CreateKabangData {
  name: string
  bang: string
  url: string
  category?: string | null
  isDefault?: boolean
}

export interface UpdateKabangData extends Partial<CreateKabangData> {}

export interface ExportBang {
  name: string
  bang: string
  url: string
  category: string | null
  isDefault: boolean
}

export interface ImportResult {
  message: string
  imported: number
  errors: string[]
}

export interface Bookmark {
  id: number
  url: string
  notes: string | null
  category: string | null
  createdAt: string
}

export interface CreateBookmarkData {
  url: string
  notes?: string | null
  category?: string | null
}

export interface UpdateBookmarkData extends Partial<CreateBookmarkData> {}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth-token')
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Kabangs
  getAllKabangs: (): Promise<Kabang[]> => 
    fetchWithAuth(`${API_URL}/kabangs`),
  
  getKabang: (id: number): Promise<Kabang> => 
    fetchWithAuth(`${API_URL}/kabangs/${id}`),
  
  createKabang: (data: CreateKabangData): Promise<Kabang> => 
    fetchWithAuth(`${API_URL}/kabangs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateKabang: (id: number, data: UpdateKabangData): Promise<Kabang> => 
    fetchWithAuth(`${API_URL}/kabangs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteKabang: (id: number): Promise<{ message: string }> => 
    fetchWithAuth(`${API_URL}/kabangs/${id}`, {
      method: 'DELETE',
    }),

  // Search
  search: (query: string): Promise<void> => {
    window.location.href = `${API_URL}/search?q=${encodeURIComponent(query)}`
    return Promise.resolve()
  },

  // Export/Import
  exportBangs: (): Promise<void> => {
    const token = localStorage.getItem('auth-token')
    const url = `${API_URL}/kabangs/export/json`
    
    // Create a temporary link to download the file
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'kabangs.json')
    if (token) {
      link.setAttribute('headers', `Authorization: Bearer ${token}`)
    }
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return Promise.resolve()
  },

  importBangs: (data: ExportBang[]): Promise<ImportResult> => 
    fetchWithAuth(`${API_URL}/kabangs/import/json`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Bookmarks
  getAllBookmarks: (): Promise<Bookmark[]> => 
    fetchWithAuth(`${API_URL}/bookmarks`),
  
  getBookmark: (id: number): Promise<Bookmark> => 
    fetchWithAuth(`${API_URL}/bookmarks/${id}`),
  
  updateBookmark: (id: number, data: UpdateBookmarkData): Promise<Bookmark> => 
    fetchWithAuth(`${API_URL}/bookmarks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteBookmark: (id: number): Promise<{ message: string }> => 
    fetchWithAuth(`${API_URL}/bookmarks/${id}`, {
      method: 'DELETE',
    }),
}
