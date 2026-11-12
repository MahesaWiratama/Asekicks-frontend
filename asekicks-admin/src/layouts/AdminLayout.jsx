import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import apiClient from '../utils/apiClient.js'
import { clearAuth, getUser } from '../utils/auth.js'

const linkClass = ({ isActive }) => `side-link ${isActive ? 'active' : ''}`

export default function AdminLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = getUser()

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout') // mencabut token di server
    } catch {
      /* tetap keluar walau server tidak merespons */
    }
    clearAuth()
    queryClient.clear()
    toast.success('Anda telah keluar')
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin">
      <aside className="sidebar">
        <h2 className="sidebar-title">My Admin</h2>
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/about" className={linkClass}>About</NavLink>
        </nav>

        <div className="sidebar-user">
          {user?.email && <small>{user.email}</small>}
          <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
