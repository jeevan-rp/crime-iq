/**
 * Catalyst Stratus (File Storage) Adapter
 * 
 * When Catalyst is configured: uses Catalyst File Store for object storage
 * When running locally: uses local filesystem under public/uploads/
 * 
 * Usage:
 *   import { uploadFile, getDownloadUrl } from '@/lib/catalyst/stratus'
 *   const file = await uploadFile('evidence', buffer, 'photo.jpg', 'image/jpeg')
 *   const url = await getDownloadUrl('evidence', 'photo.jpg')
 */

import { catalystConfig } from './config'
import { getCatalystApp } from './sdk'
import { mkdir, writeFile, readFile, unlink, readdir, stat } from 'fs/promises'
import path from 'path'

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export interface UploadedFile {
  fileName: string
  folder: string
  url: string
  size?: number
}

/** Ensure local upload directory exists */
async function ensureDir(folder: string) {
  const dir = path.join(LOCAL_UPLOAD_DIR, folder)
  await mkdir(dir, { recursive: true })
  return dir
}

/** Upload a file (Buffer or string path) to storage */
export async function uploadFile(
  folder: string,
  fileData: Buffer | Uint8Array | File,
  fileName: string,
  contentType?: string,
): Promise<UploadedFile> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      const filestore = app.filestore()

      const buffer = fileData instanceof File
        ? Buffer.from(await fileData.arrayBuffer())
        : Buffer.from(fileData)

      // Uploading file to specific folder in Catalyst
      const result = await filestore.folder(folder).uploadFile({
        code: buffer,
        name: fileName,
      })

      return {
        fileName,
        folder,
        url: `/api/files/${folder}/${fileName}`,
        size: buffer.length,
      }
    }
  } catch (error) {
    console.warn(`[Stratus] Upload failed for ${folder}/${fileName}, falling back to local:`, error)
  }

  // Fallback: local filesystem
  const dir = await ensureDir(folder)
  const buffer = fileData instanceof File
    ? Buffer.from(await fileData.arrayBuffer())
    : Buffer.from(fileData)
  const filePath = path.join(dir, fileName)
  await writeFile(filePath, buffer)

  return {
    fileName,
    folder,
    url: `/uploads/${folder}/${fileName}`,
    size: buffer.length,
  }
}

/** Get a download URL for a file */
export async function getDownloadUrl(folder: string, fileName: string): Promise<string> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      const filestore = app.filestore()
      const file = await filestore.folder(folder).getFileDetails(fileName)
      return `/api/files/${folder}/${fileName}`
    }
  } catch (error) {
    console.warn(`[Stratus] getDownloadUrl failed for ${folder}/${fileName}:`, error)
  }

  return `/uploads/${folder}/${fileName}`
}

/** Delete a file from storage */
export async function deleteFile(folder: string, fileName: string): Promise<void> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      const filestore = app.filestore()
      await filestore.folder(folder).deleteFile(fileName)
      return
    }
  } catch (error) {
    console.warn(`[Stratus] delete failed for ${folder}/${fileName}:`, error)
  }

  // Fallback: local
  try {
    const filePath = path.join(LOCAL_UPLOAD_DIR, folder, fileName)
    await unlink(filePath)
  } catch {
    // File may not exist
  }
}

/** List all files in a folder */
export async function listFiles(folder: string): Promise<UploadedFile[]> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      const filestore = app.filestore()
      // List all files in folder details
      const files = await filestore.folder(folder).getFileDetails()
      return (files || []).map((f: any) => ({
        fileName: f.file_name,
        folder,
        url: `/api/files/${folder}/${f.file_name}`,
        size: f.file_size,
      }))
    }
  } catch (error) {
    console.warn(`[Stratus] listFiles failed for ${folder}:`, error)
  }

  // Fallback: local
  try {
    const dir = path.join(LOCAL_UPLOAD_DIR, folder)
    const entries = await readdir(dir)
    const files: UploadedFile[] = []
    for (const name of entries) {
      const filePath = path.join(dir, name)
      const s = await stat(filePath)
      if (s.isFile()) {
        files.push({ fileName: name, folder, url: `/uploads/${folder}/${name}`, size: s.size })
      }
    }
    return files
  } catch {
    return []
  }
}
