export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return await response.text()
  } catch (error) {
    console.error('请求失败:', error)
    throw error
  }
}
