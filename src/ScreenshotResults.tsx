import { useEffect, useState } from 'react'
import { screenshotArchive } from './screenshotArchive'

export function ScreenshotResults({ images, onClose }: { images: string[]; onClose: () => void }) {
  const [archiveUrl] = useState(() => images.length > 1 ? URL.createObjectURL(screenshotArchive(images)) : '')
  useEffect(() => () => { if (archiveUrl) URL.revokeObjectURL(archiveUrl) }, [archiveUrl])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div role="dialog" aria-modal="true" aria-label="截图完成" className="w-full max-w-[390px] max-h-[85dvh] bg-white rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span>已生成 {images.length} 张截图</span>
          <button onClick={onClose} className="text-gray-500 px-2">关闭</button>
        </div>
        {archiveUrl && <a href={archiveUrl} download="forum-screenshots.zip" className="block text-center bg-blue-500 text-white rounded py-2 mb-3">下载全部截图（ZIP）</a>}
        <div className="overflow-y-auto space-y-4">
          <div className="text-sm text-gray-500">可逐张下载，或长按图片保存。</div>
          {images.map((src, index) => (
            <div key={index}>
              <img src={src} alt={`截图 ${index + 1}`} className="block w-full h-auto border border-gray-200" />
              <a href={src} download={`forum-${index + 1}.png`} className="block text-center text-blue-500 py-2">下载第 {index + 1} 张</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
