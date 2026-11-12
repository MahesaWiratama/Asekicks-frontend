import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../utils/apiClient.js'
import { getToken, saveAuth } from '../utils/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Sudah login -> langsung ke dashboard
  if (getToken()) return <Navigate to="/admin/dashboard" replace />

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await apiClient.post('/login', form)
      const { token, user } = res.data
      if (user?.role && user.role !== 'admin') {
        toast.error('Akun ini bukan admin.')
        return
      }
      saveAuth(token, user)
      toast.success('Login berhasil')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        toast.error('Email atau password salah.')
      } else {
        toast.error('Tidak dapat terhubung ke server. Pastikan API berjalan.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="page-title">Login Admin</h1>
        <p className="muted">Asekicks Admin</p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="username" />
          {errors.email && <small className="error">{errors.email[0]}</small>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
          {errors.password && <small className="error">{errors.password[0]}</small>}
        </div>

        <button type="submit" className="btn btn-blue btn-block" disabled={loading}>
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
