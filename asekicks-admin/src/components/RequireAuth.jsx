import { Navigate } from 'react-router-dom'
import { getToken } from '../utils/auth.js'

// Penjaga halaman: belum login -> arahkan ke /login
export default function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}
