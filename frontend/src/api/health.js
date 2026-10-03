import client from './client.js'

export async function getHealth() {
  const { data } = await client.get('/api/health')
  return data
}
