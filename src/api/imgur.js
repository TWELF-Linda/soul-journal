// src/api/imgur.js
// Free image storage — stores as base64 in the record itself (no external service needed)
// Images sync to GitHub Gist along with all other data (free, no signup required)
// Optional: if user provides an Imgur Client ID, upload to Imgur instead for smaller storage

export async function uploadToImgur(file, clientId) {
  // If Imgur Client ID is provided, use Imgur (optional, for smaller Gist size)
  if (clientId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1]
          const formData = new FormData()
          formData.append('image', base64)
          formData.append('type', 'base64')
          const res = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: { Authorization: `Client-ID ${clientId}` },
            body: formData,
          })
          const data = await res.json()
          if (data.success) resolve({ url: data.data.link })
          else reject(new Error(data.data?.error || '上傳失敗'))
        } catch (e) { reject(e) }
      }
      reader.onerror = () => reject(new Error('讀取圖片失敗'))
      reader.readAsDataURL(file)
    })
  }

  // Default: compress and store as base64 (free, works offline, syncs with Gist)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Max 600px wide to keep Gist size reasonable
        const MAX = 600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ url: canvas.toDataURL('image/jpeg', 0.78) })
      }
      img.onerror = () => reject(new Error('圖片讀取失敗'))
      img.src = ev.target.result
    }
    reader.onerror = () => reject(new Error('讀取圖片失敗'))
    reader.readAsDataURL(file)
  })
}
