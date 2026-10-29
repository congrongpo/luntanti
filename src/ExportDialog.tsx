import { useEffect, useRef, useState } from 'react'

export function ExportDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const [file] = useState(() => new File([text], `forum-post-${Date.now()}.json`, { type: 'application/json' }))
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    let active = true
    const downloadUrl = URL.createObjectURL(file)
    queueMicrotask(() => { if (active) setUrl(downloadUrl) })
    return () => { active = false; URL.revokeObjectURL(downloadUrl) }
  }, [file])
  const canShare = (() => {
    try { return !!navigator.share && !!navigator.canShare?.({ files: [file] }) } catch { return false }
  })()

  const copy = async () => {
    textRef.current?.focus()
    textRef.current?.select()
    textRef.current?.setSelectionRange(0, text.length)
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
      else if (!document.execCommand('copy')) throw new Error('copy failed')
      setMessage('已复制。在其他浏览器打开本站，选择“粘贴导入”即可恢复。')
    } catch {
      setMessage('自动复制失败，请长按下方文本，选择全选并复制。')
    }
  }

  const share = async () => {
    setBusy(true)
    setMessage('')
    try { await navigator.share({ files: [file] }) } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setMessage('分享未成功，请使用下载或复制备份。')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div role="dialog" aria-modal="true" aria-label="导出文件" className="w-full max-w-[390px] bg-white rounded-xl p-4 max-h-[85dvh] overflow-y-auto space-y-3">
        <div className="flex justify-between items-center"><span>导出文件</span><button onClick={onClose} className="text-gray-500">关闭</button></div>
        <div className="text-sm text-gray-600">QQ 内打开的页面跳转到外部浏览器时，临时文件链接可能失效。可使用系统分享保存文件，或复制备份后到其他浏览器粘贴导入。</div>
        {url && <a href={url} download={file.name} className="block py-2 text-center rounded bg-blue-500 text-white">下载 JSON 文件</a>}
        {canShare && <button disabled={busy} onClick={share} className="w-full py-2 border rounded disabled:opacity-50">系统分享 / 保存文件</button>}
        <button onClick={copy} className="w-full py-2 border rounded">复制完整备份</button>
        {message && <div role="status" className="text-sm text-gray-600">{message}</div>}
        <textarea ref={textRef} value={text} readOnly aria-label="JSON 备份内容" className="w-full h-28 border rounded p-2 text-xs" />
      </div>
    </div>
  )
}
