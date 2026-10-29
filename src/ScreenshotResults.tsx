import { useEffect, useRef, useState } from 'react'
import { screenshotArchive } from './screenshotArchive'

export function ScreenshotResults({ images, onClose }: { images: string[]; onClose: () => void }) {
  const [downloads, setDownloads] = useState<{ file: File; url: string }[]>([])
  const [archiveUrl, setArchiveUrl] = useState('')
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<number | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const batchRun = useRef(0)
  useEffect(() => () => { batchRun.current += 1 }, [images])
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

  const downloadAll = async () => {
    if (batchRunning) return
    const run = ++batchRun.current
    setError('')
    setBatchRunning(true)
    setBatchProgress(0)
    try {
      for (let index = 0; index < images.length; index++) {
        if (index > 0) await new Promise(resolve => window.setTimeout(resolve, 1200))
        if (batchRun.current !== run) return
        const link = document.createElement('a')
        link.href = images[index]
        link.download = `forum-${index + 1}.png`
        document.body.appendChild(link)
        try { link.click() } finally { link.remove() }
        setBatchProgress(index + 1)
      }
    } catch {
      if (batchRun.current === run) setError('批量下载中断，请使用 ZIP 或逐张下载。')
    } finally {
      if (batchRun.current === run) setBatchRunning(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div role="dialog" aria-modal="true" aria-label="截图完成" className="w-full max-w-[390px] max-h-[85dvh] bg-white rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span>已生成 {images.length} 张截图</span>
          <button onClick={onClose} className="text-gray-500 px-2">关闭</button>
        </div>
        <button onClick={downloadAll} disabled={batchRunning} className="shrink-0 bg-blue-500 text-white rounded py-2 mb-3 disabled:opacity-50">
          {batchRunning ? `正在发起下载 ${batchProgress ?? 0}/${images.length}` : '一键下载全部图片'}
        </button>
        {batchProgress !== null && <div role="status" className="shrink-0 text-sm text-gray-500 mb-3">
          已发起 {batchProgress}/{images.length} 张下载请求，请在浏览器下载记录中确认。若数量不足，请允许多文件下载或使用 ZIP。
        </div>}
        {archiveUrl && <a href={archiveUrl} download="forum-screenshots.zip" className="shrink-0 block text-center border border-blue-500 text-blue-500 rounded py-2 mb-3">下载全部截图（ZIP）</a>}
        <div className="overflow-y-auto space-y-4">
          <div className="text-sm text-gray-500">一键下载会逐张保存 PNG 图片。若不成功，可尝试其他五种方法：点击下载第n张图片、长按图片选择保存图片、系统分享、打开原图后长按下载、下载ZIP后解压缩保存图片。（如果依旧下载不了，请点击导出文件，去别的浏览器导入文件后再次尝试截图）</div>
          {error && <div role="alert" className="text-sm text-red-500">{error}</div>}
          {downloads.map(({ file, url }, index) => (
            <div key={index}>
              <img src={images[index]} alt={`截图 ${index + 1}`} className="block w-full h-auto border border-gray-200" />
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
