import client from './client.js'

export async function getAdminDashboard() {
  const { data } = await client.get('/api/admin/dashboard')
  return data.data
}

/** status: 'pending' | 'verified' | 'rejected' */
export async function getCompanies(status) {
  const { data } = await client.get('/api/admin/employers', { params: { verification: status } })
  return data.data
}

export async function decideCompany(id, decision, reason) {
  const { data } = await client.patch(`/api/admin/employers/${id}/verify`, { decision, reason })
  return data.data
}

export async function getSettings() {
  const { data } = await client.get('/api/admin/settings')
  return data.data
}

export async function updateSettings(values) {
  const { data } = await client.put('/api/admin/settings', values)
  return data.data
}
