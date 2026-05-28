// src/api/imgur.js
// Free image hosting via Imgur API (anonymous uploads, no account needed)

const IMGUR_API = 'https://api.imgur.com/3/image'

export async function uploadToImgur(file, clientId) {
  if (!clientId) throw new Error('請先在設定中填入 Imgur Client ID')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1]
        const formData = new FormData()
        formData.append('image', base64)
        formData.append('type', 'base64')
        formData.append('title', `SoulNote_${Date.now()}`)

        const res = await fetch(IMGUR_API, {
          method: 'POST',
          headers: { Authorization: `Client-ID ${clientId}` },
          body: formData,
        })
        const data = await res.json()
        if (data.success) {
          resolve({
            url: data.data.link,
            deleteHash: data.data.deletehash,
            id: data.data.id,
          })
        } else {
          reject(new Error(data.data?.error || '上傳失敗'))
        }
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(new Error('讀取圖片失敗'))
    reader.readAsDataURL(file)
  })
}
