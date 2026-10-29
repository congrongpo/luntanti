import { useEffect, useState } from 'react'
import { screenshotArchive } from './screenshotArchive'

export function ScreenshotResults({ images, onClose }: { images: string[]; onClose: () => void }) {
  const [downloads, setDownloads] = useState<{ file: File; url: string }[]>([])
  const [archiveUrl, setArchiveUrl] = useState('')
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  useEffect(() => {
    let active = true
    const files = images.map((src, index) => {
      const bytes = Uint8Array.from(atob(src.slice(src.indexOf(',') + 1)), c => c.charCodeAt(0))
      const file = new File([bytes], `forum-${index + 1}.png`, { type: 'image/png' })
      return { file, url: URL.createObjectURL(file) }
    })
    const archive = images.length > 1 ? URL.createObjectURL(screenshotArchive(images)) : ''
    queueMicrotask(() => {
      if (!active) return
      setDownloads(files)
      setArchiveUrl(archive)
    })
    return () => {
      active = false
      files.forEach(({ url }) => URL.revokeObjectURL(url))
      if (archive) URL.revokeObjectURL(archive)
    }
  }, [images])

  const canShare = (file: File) => {
    try {
      return !!navigator.share && !!navigator.canShare?.({ files: [file] })
    } catch {
      return false
    }
  }

  const share = async (file: File) => {
    setError('')
    setSharing(true)
    try {
      await navigator.share({ files: [file] })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('系统分享未成功，请尝试下载图片、打开原图或下载 ZIP。')
      }
    } finally {
      setSharing(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div role="dialog" aria-modal="true" aria-label="截图完成" className="w-full max-w-[390px] max-h-[85dvh] bg-white rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span>已生成 {images.length} 张截图</span>
          <button onClick={onClose} className="text-gray-500 px-2">关闭</button>
        </div>
        {archiveUrl && <a href={archiveUrl} download="forum-screenshots.zip" className="block text-center bg-blue-500 text-white rounded py-2 mb-3">下载全部截图（ZIP）</a>}
        <div className="overflow-y-auto space-y-4">
          <div className="text-sm text-gray-500">下载图片的五种方法：点击下载第n张图片、长按图片选择保存图片、系统分享、打开原图后长按下载、下载ZIP后解压缩保存图片。（如果依旧下载不了，请点击导出文件，去别的浏览器导入文件后再次尝试截图）</div>
          {error && <div role="alert" className="text-sm text-red-500">{error}</div>}
          {downloads.map(({ file, url }, index) => (
            <div key={index}>
              <img src={url} alt={`截图 ${index + 1}`} className="block w-full h-auto border border-gray-200" />
              <div className="flex flex-wrap justify-center gap-4 text-blue-500 text-sm py-2">
                <a href={url} download={file.name}>下载第 {index + 1} 张</a>
                {canShare(file) && <button disabled={sharing} onClick={() => share(file)} className="disabled:opacity-50">系统分享 / 保存</button>}
                <a href={url} target="_blank" rel="noopener noreferrer">打开原图</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
