import axios from 'axios'

const TOKEN_KEY = 'fundmatrix_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired / invalid: drop it and bounce to login (once).
    if (error.response?.status === 401 && getToken()) {
      setToken(null)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

/** Extracts a human-readable message from an Axios error / ApiError body. */
export function errorMessage(e) {
  const data = e?.response?.data
  if (data) {
    if (data.fieldErrors) {
      const first = Object.values(data.fieldErrors)[0]
      if (first) return first
    }
    if (data.message) return data.message
  }
  return e?.message ?? 'Something went wrong'
}
