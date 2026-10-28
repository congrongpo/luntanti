import { useRef, useState } from 'react'
import { avatarPresets, resolveAvatarSrc } from './avatarPresets'
import { OwnerAvatar } from './OwnerAvatar'

async function readImage(file: File, avatar: boolean): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, (avatar ? 256 : 1600) / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法读取图片，请重试')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function ImageDialog({ images, avatar = false, onSave, onClose }: {
  images: string[]
  avatar?: boolean
  onSave: (images: string[]) => void
  onClose: () => void
}) {
  const [pending, setPending] = useState(() => avatar ? images.map(resolveAvatarSrc) : images)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reading = useRef(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={avatar ? '修改楼主头像' : '添加图片'}
        className="w-full max-w-[360px] bg-white rounded-xl p-4 max-h-[80dvh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="mb-3 font-medium text-sm text-gray-800">{avatar ? '修改楼主头像' : '添加图片'}</div>
        {avatar && (
          <div className="mb-3">
            <div className="mb-2 text-sm text-gray-600">默认头像颜色</div>
            <div className="flex flex-wrap gap-2">
              {avatarPresets.map(preset => (
                <button key={preset.name} type="button" disabled={busy}
                  aria-label={`${preset.name}默认头像`}
                  aria-pressed={(pending[0] ?? '') === preset.src}
                  title={`${preset.name}默认头像`}
                  className={`rounded-xl p-1 disabled:opacity-50 ${(pending[0] ?? '') === preset.src ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setPending(preset.src ? [preset.src] : [])}>
                  <OwnerAvatar src={preset.src} />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="overflow-y-auto space-y-3">
          {pending.map((src, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <img src={src} alt={avatar ? '头像预览' : `图片预览 ${index + 1}`}
                  className={avatar ? 'w-20 h-20 rounded-lg object-cover' : 'block w-auto h-auto max-w-full max-h-48 object-contain'} />
              </div>
              <button disabled={busy} className="text-red-500 text-sm shrink-0" onClick={() => setPending(p => p.filter((_, i) => i !== index))}>移除</button>
            </div>
          ))}
        </div>
        <label className={`block border rounded py-2 mt-3 text-center text-sm ${busy ? 'opacity-50' : 'cursor-pointer'}`}>
          {busy ? '正在读取图片…' : avatar ? '选择头像' : '选择图片（可多选）'}
          <input type="file" accept="image/*" multiple={!avatar} disabled={busy} className="hidden"
            onChange={async e => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (!files.length || reading.current) return
              reading.current = true
              setBusy(true)
              setError('')
              try {
                const added: string[] = []
                for (const file of avatar ? files.slice(0, 1) : files) added.push(await readImage(file, avatar))
                setPending(p => avatar ? added : [...p, ...added])
              } catch (err) {
                setError(err instanceof Error ? `图片读取失败：${err.message}` : '图片读取失败，请重试')
              } finally {
                reading.current = false
                setBusy(false)
              }
            }} />
        </label>
        {error && <div role="alert" className="text-sm text-red-500 mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
          <button disabled={busy} onClick={() => { onSave(pending); onClose() }}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded disabled:opacity-50">保存</button>
        </div>
      </div>
    </div>
  )
}
