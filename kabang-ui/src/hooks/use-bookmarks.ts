import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Bookmark, type UpdateBookmarkData } from '../lib/api'

const BOOKMARKS_KEY = 'bookmarks'

export function useBookmarks() {
  return useQuery({
    queryKey: [BOOKMARKS_KEY],
    queryFn: api.getAllBookmarks,
  })
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookmarkData }) => 
      api.updateBookmark(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_KEY] })
    },
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKMARKS_KEY] })
    },
  })
}
