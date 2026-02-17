import { createFileRoute } from '@tanstack/react-router'
import { useKabangs, useCreateKabang, useUpdateKabang, useDeleteKabang, useExportBangs, useImportBangs } from '../hooks/use-kabangs'
import { useBookmarks, useUpdateBookmark, useDeleteBookmark } from '../hooks/use-bookmarks'
import { Plus, Search, Edit2, Trash2, Star, X, Check, StarOff, Download, Upload, Github, ExternalLink, Bookmark } from 'lucide-react'
import { useState, useRef } from 'react'
import type { Kabang, CreateKabangData, Bookmark as BookmarkType, UpdateBookmarkData } from '../lib/api'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

type Tab = 'bangs' | 'bookmarks'

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bangs')
  
  // Bangs hooks
  const { data: kabangs, isLoading: isLoadingKabangs, error: kabangsError } = useKabangs()
  const createMutation = useCreateKabang()
  const updateMutation = useUpdateKabang()
  const deleteMutation = useDeleteKabang()
  const exportMutation = useExportBangs()
  const importMutation = useImportBangs()
  
  // Bookmarks hooks
  const { data: bookmarks, isLoading: isLoadingBookmarks, error: bookmarksError } = useBookmarks()
  const updateBookmarkMutation = useUpdateBookmark()
  const deleteBookmarkMutation = useDeleteBookmark()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Bang modal state
  const [isBangModalOpen, setIsBangModalOpen] = useState(false)
  const [editingKabang, setEditingKabang] = useState<Kabang | null>(null)
  const [bangFormData, setBangFormData] = useState<CreateKabangData>({
    name: '',
    bang: '',
    url: '',
    category: '',
    isDefault: false,
  })
  
  // Bookmark modal state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null)
  const [bookmarkFormData, setBookmarkFormData] = useState<UpdateBookmarkData>({
    url: '',
    notes: '',
    category: '',
  })

  const filteredKabangs = kabangs?.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.bang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.category && k.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  const filteredBookmarks = bookmarks?.filter(b => 
    (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleBangSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingKabang) {
        await updateMutation.mutateAsync({
          id: editingKabang.id,
          data: bangFormData,
        })
      } else {
        await createMutation.mutateAsync(bangFormData)
      }
      closeBangModal()
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const handleBookmarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingBookmark) return
    
    try {
      await updateBookmarkMutation.mutateAsync({
        id: editingBookmark.id,
        data: bookmarkFormData,
      })
      closeBookmarkModal()
    } catch (err) {
      console.error('Failed to save bookmark:', err)
    }
  }

  const handleDeleteBang = async (id: number) => {
    if (confirm('Are you sure you want to delete this bang?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleDeleteBookmark = async (id: number) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      await deleteBookmarkMutation.mutateAsync(id)
    }
  }

  const openAddBangModal = () => {
    setEditingKabang(null)
    setBangFormData({
      name: '',
      bang: '',
      url: '',
      category: '',
      isDefault: false,
    })
    setIsBangModalOpen(true)
  }

  const openEditBangModal = (kabang: Kabang) => {
    setEditingKabang(kabang)
    setBangFormData({
      name: kabang.name,
      bang: kabang.bang,
      url: kabang.url,
      category: kabang.category || '',
      isDefault: kabang.isDefault,
    })
    setIsBangModalOpen(true)
  }

  const openEditBookmarkModal = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark)
    setBookmarkFormData({
      url: bookmark.url,
      notes: bookmark.notes || '',
      category: bookmark.category || '',
    })
    setIsBookmarkModalOpen(true)
  }

  const closeBangModal = () => {
    setIsBangModalOpen(false)
    setEditingKabang(null)
  }

  const closeBookmarkModal = () => {
    setIsBookmarkModalOpen(false)
    setEditingBookmark(null)
  }

  const handleSetDefault = async (kabang: Kabang) => {
    if (!kabang.isDefault) {
      await updateMutation.mutateAsync({
        id: kabang.id,
        data: { isDefault: true },
      })
    }
  }

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        setImportError('Invalid file format: must be a JSON array')
        return
      }

      const result = await importMutation.mutateAsync(data)
      
      if (result.errors.length > 0) {
        setImportError(`Imported ${result.imported} bangs with ${result.errors.length} errors`)
      } else {
        alert(`Successfully imported ${result.imported} bangs`)
      }
    } catch (err) {
      console.error('Import failed:', err)
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const isLoading = activeTab === 'bangs' ? isLoadingKabangs : isLoadingBookmarks
  const error = activeTab === 'bangs' ? kabangsError : bookmarksError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
        Error loading {activeTab}: {error.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <span className="text-xl font-bold text-white">!</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Kabang Dashboard
              </h1>
            </div>
            <a
              href="https://github.com/Pranav-Official/kabang"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('bangs')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bangs'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Bangs ({kabangs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bookmarks'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Bookmarks ({bookmarks?.length || 0})
            </button>
          </div>

          {/* Stats */}
          {activeTab === 'bangs' && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {kabangs?.length || 0}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Default</div>
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                  {kabangs?.find(k => k.isDefault)?.name || 'Not set'}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Categories</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {new Set(kabangs?.map(k => k.category).filter(Boolean)).size || 0}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {bookmarks?.length || 0}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Categories</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {new Set(bookmarks?.map(b => b.category).filter(Boolean)).size || 0}
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {activeTab === 'bangs' && (
              <>
                <button
                  onClick={openAddBangModal}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Bang
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleImportClick}
                  disabled={importMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Import Error */}
          {importError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-yellow-700 dark:text-yellow-300 text-sm">
              {importError}
            </div>
          )}

          {/* Bangs Table */}
          {activeTab === 'bangs' && (
            <>
              {filteredKabangs?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="text-4xl mb-2">!</div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {searchQuery ? 'No bangs found' : 'No bangs yet'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Try a different search term' : 'Add your first bang to get started'}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Bang</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">URL</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKabangs?.map((kabang) => (
                        <tr
                          key={kabang.id}
                          className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                            kabang.isDefault ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                          }`}
                        >
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">!{kabang.bang}</span>
                              {kabang.isDefault && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{kabang.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            {kabang.category && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                {kabang.category}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-xs">
                              {kabang.url}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center gap-1">
                              {!kabang.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(kabang)}
                                  className="p-1.5 text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                                  title="Set as default"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditBangModal(kabang)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBang(kabang.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Bookmarks Grid */}
          {activeTab === 'bookmarks' && (
            <>
              {filteredBookmarks?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="text-4xl mb-2"><Bookmark className="w-12 h-12 mx-auto text-slate-400" /></div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Try a different search term' : 'Use !!mark "notes" <url> to save bookmarks'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookmarks?.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 mb-1">
                            {bookmark.notes || 'No notes'}
                          </p>
                          {bookmark.url ? (
                            <a
                              href={bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                              title={bookmark.url}
                            >
                              {bookmark.url}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No URL</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {bookmark.category && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                              {bookmark.category}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {bookmark.url && (
                            <a
                              href={bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                              title="Visit"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditBookmarkModal(bookmark)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bang Modal */}
      {isBangModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingKabang ? 'Edit Bang' : 'Add New Bang'}
              </h2>
              <button
                onClick={closeBangModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBangSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={bangFormData.name}
                  onChange={(e) => setBangFormData({ ...bangFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Google"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bang Trigger *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">!</span>
                  <input
                    type="text"
                    value={bangFormData.bang}
                    onChange={(e) => setBangFormData({ ...bangFormData, bang: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="g"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Users type !bang to use this search
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL or Template *
                </label>
                <input
                  type="text"
                  value={bangFormData.url}
                  onChange={(e) => setBangFormData({ ...bangFormData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://google.com/search?q={query} or https://gmail.com"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use {'{query}'} for searches, or any URL as a shortcut.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={bangFormData.category || ''}
                  onChange={(e) => setBangFormData({ ...bangFormData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={bangFormData.isDefault}
                  onChange={(e) => setBangFormData({ ...bangFormData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300">
                  Set as default search engine
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeBangModal}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingKabang ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookmark Modal */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Edit Bookmark
              </h2>
              <button
                onClick={closeBookmarkModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookmarkSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL *
                </label>
                <input
                  type="text"
                  value={bookmarkFormData.url}
                  onChange={(e) => setBookmarkFormData({ ...bookmarkFormData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={bookmarkFormData.notes || ''}
                  onChange={(e) => setBookmarkFormData({ ...bookmarkFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Your notes about this bookmark..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={bookmarkFormData.category || ''}
                  onChange={(e) => setBookmarkFormData({ ...bookmarkFormData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Work, Personal, Research"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeBookmarkModal}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBookmarkMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {updateBookmarkMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
