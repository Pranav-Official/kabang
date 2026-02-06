import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Kabang, type CreateKabangData, type UpdateKabangData } from '../lib/api'

const KABANGS_KEY = 'kabangs'

export function useKabangs() {
  return useQuery({
    queryKey: [KABANGS_KEY],
    queryFn: api.getAllKabangs,
  })
}

export function useCreateKabang() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createKabang,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KABANGS_KEY] })
    },
  })
}

export function useUpdateKabang() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateKabangData }) => 
      api.updateKabang(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KABANGS_KEY] })
    },
  })
}

export function useDeleteKabang() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteKabang,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KABANGS_KEY] })
    },
  })
}
