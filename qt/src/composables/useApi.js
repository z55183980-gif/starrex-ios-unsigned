import axios from 'axios'
import { API_BASE_URL } from '@/api/request'

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err)
    return Promise.reject(err)
  }
)

export const useApi = () => {
  const get = (url, params = {}) => instance.get(url, { params })
  const post = (url, data = {}, config = {}) => instance.post(url, data, config)
  return { get, post }
}