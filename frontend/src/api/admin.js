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

/** status: 'pending' (oldest first) | 'open' | 'rejected' */
export async function getPostingQueue(status) {
  const { data } = await client.get('/api/admin/job-postings', { params: { status } })
  return data.data
}

export async function getPostingForReview(id) {
  const { data } = await client.get(`/api/admin/job-postings/${id}`)
  return data.data
}

/**
 * decision: 'approve' | 'reject' (a reason is required to reject). updatedAt is the posting's
 * `updated_at` the admin reviewed; the API refuses (409) if the posting changed since.
 */
export async function decidePosting(id, decision, reason, updatedAt) {
  const { data } = await client.patch(`/api/admin/job-postings/${id}/approve`, { decision, reason, updated_at: updatedAt })
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
