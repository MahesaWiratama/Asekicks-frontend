import axios from 'axios'
import { clearAuth, getToken } from './auth.js'

// Konfigurasi dasar Axios: alamat API dan header bawaan.
// Alamat bawaan sama dengan "php artisan serve" (port 8000) maupun API tiruan "npm run api".
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Interceptor request: sebelum tiap request dikirim, tempelkan token login (bila ada).
// Dibaca setiap kali request, sehingga token yang baru disimpan setelah login langsung terpakai.
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor response: token kedaluwarsa/tidak valid (401) -> hapus token dan kembali ke halaman login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearAuth()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default apiClient
