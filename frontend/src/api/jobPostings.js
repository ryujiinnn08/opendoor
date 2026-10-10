import client from './client.js'

/** status: 'all' | 'open' | 'pending' | 'draft' | 'rejected' | 'closed'; department (owners): an id */
export async function getJobPostings({ status, department } = {}) {
  const { data } = await client.get('/api/employer/job-postings', {
    params: { status, department: department || undefined },
  })
  return data.data
}

export async function getJobPosting(id) {
  const { data } = await client.get(`/api/employer/job-postings/${id}`)
  return data.data
}

/** Saves a draft; `submit: true` sends it for approval at once. */
export async function createJobPosting(values) {
  const { data } = await client.post('/api/employer/job-postings', values)
  return data.data
}

export async function updateJobPosting(id, values) {
  const { data } = await client.put(`/api/employer/job-postings/${id}`, values)
  return data.data
}

export async function deleteJobPosting(id) {
  await client.delete(`/api/employer/job-postings/${id}`)
}

/** action: 'close' | 'reopen' | 'change_closing_date'; the last two need closesOn ('YYYY-MM-DD'). */
export async function changePostingStatus(id, action, closesOn) {
  const { data } = await client.patch(`/api/employer/job-postings/${id}/status`, { action, closes_on: closesOn })
  return data.data
}
