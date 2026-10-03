import client from './client.js'

export async function getCategories() {
  const { data } = await client.get('/api/categories')
  return data.data
}

/** Active accommodation types grouped: [{ group, accommodations: [...] }] */
export async function getAccommodationGroups() {
  const { data } = await client.get('/api/accommodations')
  return data.data
}

// Admin

export async function createCategory(values) {
  const { data } = await client.post('/api/admin/categories', values)
  return data.data
}

export async function updateCategory(id, values) {
  const { data } = await client.put(`/api/admin/categories/${id}`, values)
  return data.data
}

export async function deleteCategory(id) {
  await client.delete(`/api/admin/categories/${id}`)
}

/** All accommodation types, including retired ones. */
export async function getAdminAccommodations() {
  const { data } = await client.get('/api/admin/accommodations')
  return data.data
}

export async function createAccommodation(values) {
  const { data } = await client.post('/api/admin/accommodations', values)
  return data.data
}

export async function updateAccommodation(id, values) {
  const { data } = await client.put(`/api/admin/accommodations/${id}`, values)
  return data.data
}

export async function setAccommodationActive(id, isActive) {
  const { data } = await client.patch(`/api/admin/accommodations/${id}/status`, { is_active: isActive })
  return data.data
}
