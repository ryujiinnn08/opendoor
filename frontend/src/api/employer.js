import client from './client.js'

export async function setupEmployer(values) {
  const { data } = await client.post('/api/employer/setup', values)
  return data.data
}

export async function getEmployerProfile() {
  const { data } = await client.get('/api/employer/profile')
  return data.data
}

export async function updateEmployerProfile(values) {
  const { data } = await client.put('/api/employer/profile', values)
  return data.data
}

export async function uploadLogo(file) {
  const form = new FormData()
  form.append('logo', file)
  const { data } = await client.post('/api/employer/profile/logo', form)
  return data.data
}

export async function removeLogo() {
  const { data } = await client.delete('/api/employer/profile/logo')
  return data.data
}

export async function submitVerification(values) {
  const { data } = await client.post('/api/employer/verification', values)
  return data.data
}

/** Departments with HR officers, unused invites and places, plus the platform cap. */
export async function getDepartments() {
  const { data } = await client.get('/api/employer/departments')
  return { departments: data.data, cap: data.meta.cap, defaultLimit: data.meta.default_limit }
}

export async function createDepartment(values) {
  const { data } = await client.post('/api/employer/departments', values)
  return data.data
}

export async function updateDepartment(id, values) {
  const { data } = await client.put(`/api/employer/departments/${id}`, values)
  return data.data
}

export async function deleteDepartment(id) {
  await client.delete(`/api/employer/departments/${id}`)
}

/** Returns { id, url, expires_at }. The link is only ever returned here. */
export async function createInvite(departmentId) {
  const { data } = await client.post(`/api/employer/departments/${departmentId}/invites`)
  return data.data
}

export async function revokeInvite(id) {
  await client.delete(`/api/employer/invites/${id}`)
}

export async function moveMember(memberId, departmentId) {
  await client.patch(`/api/employer/members/${memberId}`, { department_id: departmentId })
}

export async function removeMember(memberId) {
  await client.delete(`/api/employer/members/${memberId}`)
}
