// Penyimpanan token login (Sanctum) dan data user di localStorage.
// Dibungkus try/catch agar aplikasi tetap jalan bila localStorage diblokir browser.
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export const saveAuth = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user ?? null))
  } catch { /* abaikan */ }
}

export const clearAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* abaikan */ }
}
