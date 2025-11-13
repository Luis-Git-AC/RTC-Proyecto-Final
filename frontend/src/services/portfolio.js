import { request } from './api'

export function getPortfolio(token) {
  return request('users/me/portfolio', { token })
}

export function savePortfolio(token, items) {
  return request('users/me/portfolio', {
    method: 'PUT',
    token,
    data: { items },
  })
}
