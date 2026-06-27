import { useCallback, useState } from 'react'
import { getCloudinarySignature } from '../../services/api'

const FOLDER = 'thrift-products' // must match the server-signed folder

/**
 * Direct-to-Cloudinary signed upload. Requests a fresh signature from the
 * backend per file, then POSTs the file straight to Cloudinary so the
 * secret never touches the client. Returns the secure URL.
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(async (file, onProgress) => {
    const { timestamp, signature, apiKey, cloudName } =
      await getCloudinarySignature()

    const form = new FormData()
    form.append('file', file)
    form.append('api_key', apiKey)
    form.append('timestamp', timestamp)
    form.append('signature', signature)
    form.append('folder', FOLDER)

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText)
            resolve(res.secure_url)
          } catch {
            reject(new Error('Unexpected upload response'))
          }
        } else {
          let msg = 'Upload failed'
          try {
            msg = JSON.parse(xhr.responseText)?.error?.message || msg
          } catch { /* keep default */ }
          reject(new Error(msg))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(form)
    })
  }, [])

  return { upload, uploading, setUploading }
}
