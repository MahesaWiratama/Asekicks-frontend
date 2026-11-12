import { createContext, useContext } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './apiClient'

// Global state (useContext): semua fungsi API produk dikelola di satu tempat dan
// dapat dipakai halaman admin mana pun tanpa mengoper props berlapis-lapis.
const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const queryClient = useQueryClient()

  // Setelah data berubah, tandai semua cache "products" kedaluwarsa agar daftar diambil ulang.
  // (React Query v5 memakai bentuk objek: { queryKey: [...] })
  const refreshProducts = () => queryClient.invalidateQueries({ queryKey: ['products'] })

  // GET ALL PRODUCTS dengan pagination dan filter (nama parameter mengikuti ProductController Laravel):
  // GET /products?page=1&per_page=5&category_id=1&search=nike
  const getProducts = async ({ page = 1, limit = 5, category_id = '', keyword = '' } = {}) => {
    const params = { page, per_page: limit }
    if (category_id) params.category_id = category_id
    if (keyword.trim()) params.search = keyword.trim()

    const res = await apiClient.get('/products', { params })
    const body = res.data
    const items = Array.isArray(body) ? body : (body.data ?? [])
    // Mendukung format paginate Laravel: { data, meta: { last_page, total } } maupun { data, last_page, total }
    const meta = (!Array.isArray(body) && (body.meta ?? body)) || {}
    return {
      items,
      page: meta.current_page ?? page,
      lastPage: meta.last_page ?? (items.length >= limit ? page + 1 : page),
      total: meta.total ?? items.length,
    }
  }

  // SHOW PRODUCT DETAIL
  const getProductById = async (id) => {
    const res = await apiClient.get(`/products/${id}`)
    return res.data.data
  }

  // STORE PRODUCT (multipart karena ada file gambar)
  const addProduct = async (formData) => {
    const response = await apiClient.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    refreshProducts()
    return response
  }

  // UPDATE PRODUCT: Laravel tidak membaca multipart pada PUT, jadi dikirim POST dengan ?_method=PUT
  const updateProduct = async (id, formData) => {
    const response = await apiClient.post(`/products/${id}?_method=PUT`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    refreshProducts()
    return response
  }

  // DELETE PRODUCT (useMutation memberi isPending/isError/isSuccess)
  const deleteProduct = useMutation({
    mutationFn: async (id) => apiClient.delete(`/products/${id}`),
    onSuccess: refreshProducts,
  })

  // GET CATEGORIES untuk dropdown pada form dan filter
  const getCategories = async () => {
    const res = await apiClient.get('/categories')
    return Array.isArray(res.data) ? res.data : (res.data.data ?? [])
  }

  const value = { getProducts, getProductById, addProduct, updateProduct, deleteProduct, getCategories }
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

// Custom hook agar komponen cukup memanggil useProducts()
// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts harus dipakai di dalam <ProductProvider>')
  return ctx
}
