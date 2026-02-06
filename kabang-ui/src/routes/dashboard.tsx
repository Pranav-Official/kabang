import { createFileRoute } from '@tanstack/react-router'
import { useKabangs, useCreateKabang, useUpdateKabang, useDeleteKabang } from '../hooks/use-kabangs'
import { Plus, Search, Edit2, Trash2, Star, X, Check, StarOff } from 'lucide-react'
import { useState } from 'react'
import type { Kabang, CreateKabangData } from '../lib/api'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: kabangs, isLoading, error } = useKabangs()
  const createMutation = useCreateKabang()
  const updateMutation = useUpdateKabang()
  const deleteMutation = useDeleteKabang()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKabang, setEditingKabang] = useState<Kabang | null>(null)
  const [formData, setFormData] = useState<CreateKabangData>({
    name: '',
    bang: '',
    url: '',
    category: '',
    isDefault: false,
  })

  const filteredKabangs = kabangs?.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.bang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.category && k.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingKabang) {
        await updateMutation.mutateAsync({
          id: editingKabang.id,
          data: formData,
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      closeModal()
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this bang?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const openAddModal = () => {
    setEditingKabang(null)
    setFormData({
      name: '',
      bang: '',
      url: '',
      category: '',
      isDefault: false,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (kabang: Kabang) => {
    setEditingKabang(kabang)
    setFormData({
      name: kabang.name,
      bang: kabang.bang,
      url: kabang.url,
      category: kabang.category || '',
      isDefault: kabang.isDefault,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingKabang(null)
  }

  const handleSetDefault = async (kabang: Kabang) => {
    if (!kabang.isDefault) {
      await updateMutation.mutateAsync({
        id: kabang.id,
        data: { isDefault: true },
      })
    }
  }

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
        Error loading bangs: {error.message}
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Stats - Compact Row */}
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

          {/* Actions Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Bang
            </button>
          </div>

          {/* Table */}
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
                            onClick={() => openEditModal(kabang)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(kabang.id)}
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
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingKabang ? 'Edit Bang' : 'Add New Bang'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.bang}
                    onChange={(e) => setFormData({ ...formData, bang: e.target.value })}
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
                  URL Template *
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://google.com/search?q={query}"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use {'{query}'} where search term should go
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300">
                  Set as default search engine
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
    </div>
  )
}
