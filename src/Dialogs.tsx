import { useLayoutEffect, useRef, useState } from 'react'
import type { Floor } from './types'

export function SingleFieldDialog({
  label, value, multiline = false, onSave, onClose,
}: {
  label: string
  value: string
  multiline?: boolean
  onSave: (v: string) => void
  onClose: () => void
}) {
  const [v, setV] = useState(value)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="w-full max-w-[360px] bg-white rounded-xl p-4" onClick={e => e.stopPropagation()}>
        <div className="mb-2 font-medium text-sm text-gray-800">{label}</div>
        {multiline ? (
          <textarea value={v} onChange={e => setV(e.target.value)} rows={5}
            className="w-full border rounded p-2 text-sm" />
        ) : (
          <input value={v} onChange={e => setV(e.target.value)}
            className="w-full border rounded p-2 text-sm" />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
          <button onClick={() => { onSave(v); onClose() }}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded">保存</button>
        </div>
      </div>
    </div>
  )
}

export function ActionSheet({
  items, onAction, onClose,
}: {
  items: { key: string; label: string; danger?: boolean }[]
  onAction: (key: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-[390px] bg-white rounded-t-xl pb-2" onClick={e => e.stopPropagation()}>
        {items.map(it => (
          <button key={it.key} onClick={() => onAction(it.key)}
            className={`w-full py-3.5 text-center text-[15px] border-b last:border-0 ${it.danger ? 'text-red-500' : 'text-gray-700'}`}>
            {it.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export const FLOOR_MENU_ITEMS = [
  { key: 'images', label: '添加图片' },
  { key: 'insertAbove', label: '向上插入楼层' },
  { key: 'editContent', label: '修改内容' },
  { key: 'editNickname', label: '修改昵称' },
  { key: 'quote', label: '引用某层楼' },
  { key: 'move', label: '移动到某层之上' },
  { key: 'likes', label: '修改点赞数' },
  { key: 'owner', label: '设为楼主 / 取消楼主' },
  { key: 'delete', label: '删除本层', danger: true },
]

export const HEADER_MENU_ITEMS = [
  { key: 'avatar', label: '修改楼主头像' },
  { key: 'title', label: '修改标题' },
  { key: 'nickname', label: '修改楼主名称' },
  { key: 'body', label: '修改正文' },
  { key: 'board', label: '版面选择' },
]

export function FloorPicker({
  title, floors, multiple, selected, initialScrollToBottom = false, onConfirm, onClose,
}: {
  title: string
  floors: Floor[]
  multiple: boolean
  selected?: string[]
  initialScrollToBottom?: boolean
  onConfirm: (ids: string[]) => void
  onClose: () => void
}) {
  const [picked, setPicked] = useState<string[]>(selected ?? [])
  const listRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (initialScrollToBottom && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [initialScrollToBottom])

  const toggle = (id: string) => {
    if (multiple) {
      setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))
    } else {
      setPicked([id])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="w-full max-w-[360px] bg-white rounded-xl p-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="mb-3 font-medium text-sm text-gray-800">{title}</div>
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar border rounded divide-y">
          {floors.map((f, i) => (
            <button key={f.id} onClick={() => toggle(f.id)}
              className={`w-full text-left px-3 py-2.5 text-[14px] ${picked.includes(f.id) ? 'bg-blue-50' : ''}`}>
              <span className="text-gray-400 mr-2">{i + 1}楼</span>
              <span className="font-medium text-gray-700">{f.nickname || '匿名'}</span>
              <span className="text-gray-500">：{f.content.slice(0, 30)}{f.content.length > 30 ? '…' : ''}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
          <button onClick={() => { onConfirm(picked); onClose() }}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded">确定</button>
        </div>
      </div>
    </div>
  )
}

export function LikesDialog({ value, onSave, onClose }: {
  value: number
  onSave: (v: number) => void
  onClose: () => void
}) {
  const [v, setV] = useState(String(value))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="w-full max-w-[360px] bg-white rounded-xl p-4" onClick={e => e.stopPropagation()}>
        <div className="mb-2 font-medium text-sm text-gray-800">修改点赞数</div>
        <input type="number" min={0} value={v} onChange={e => setV(e.target.value)}
          className="w-full border rounded p-2 text-sm" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
          <button onClick={() => { onSave(Math.max(0, Number(v) || 0)); onClose() }}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded">保存</button>
        </div>
      </div>
    </div>
  )
}

export type ScreenshotConfig = {
  keepHeader: boolean
  startFloor: number
  endFloor: number
  floorsPerShot: number
}

export function ScreenshotDialog({ totalFloors, onStart, onClose }: {
  totalFloors: number
  onStart: (config: ScreenshotConfig) => void
  onClose: () => void
}) {
  const [keepHeader, setKeepHeader] = useState(true)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(Math.max(0, totalFloors - 1))
  const [perShot, setPerShot] = useState(4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="w-full max-w-[360px] bg-white rounded-xl p-4 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="font-medium text-sm text-gray-800">截图设置</div>
        <label className="flex items-center justify-between text-[14px]">
          保留帖子开头
          <input type="checkbox" className="w-4 h-4" checked={keepHeader} onChange={e => setKeepHeader(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between text-[14px]">
          开始楼层
          <select value={start} onChange={e => setStart(Number(e.target.value))} className="border rounded px-2 py-1">
            {Array.from({ length: totalFloors }, (_, i) => <option key={i} value={i}>{i + 1}楼</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between text-[14px]">
          结束楼层
          <select value={end} onChange={e => setEnd(Number(e.target.value))} className="border rounded px-2 py-1">
            {Array.from({ length: totalFloors }, (_, i) => <option key={i} value={i}>{i + 1}楼</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between text-[14px]">
          每张包含层数
          <input type="number" min={1} max={20} value={perShot}
            onChange={e => setPerShot(Math.max(1, Number(e.target.value) || 4))}
            className="border rounded px-2 py-1 w-16 text-center" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
          <button onClick={() => {
            if (totalFloors === 0) { alert('还没有楼层可以截图'); return }
            if (start > end) { alert('开始楼层不能大于结束楼层'); return }
            onStart({ keepHeader, startFloor: start, endFloor: end, floorsPerShot: perShot })
          }} className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded">开始截图（可能需要等待几秒钟）</button>
        </div>
      </div>
    </div>
  )
}

export function FontSizeSetting({
  label, value, onChange, min = 12, max = 30
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onChange(Math.max(min, value - 1))} 
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-300"
        >-</button>
        <span className="w-6 text-center font-medium text-gray-800">{value}</span>
        <button 
          onClick={() => onChange(Math.min(max, value + 1))} 
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-300"
        >+</button>
      </div>
    </div>
  )
}
