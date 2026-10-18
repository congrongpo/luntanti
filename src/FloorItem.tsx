import { useRef } from 'react'
import type { Floor } from './types'

type Props = {
  floor: Floor
  index: number          // 在 floors 数组里的原始索引，用于显示楼层号
  floors: Floor[]        // 用于渲染引用内容
  showLikes: boolean
  onLongPress: (id: string) => void
}

export function FloorItem({ floor, index, floors, showLikes, onLongPress }: Props) {
  // 长按检测：按下 500ms 触发，抬起/移出取消
  const timer = useRef<number | null>(null)
  const start = () => {
    timer.current = window.setTimeout(() => onLongPress(floor.id), 500)
  }
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
  }

  return (
    <div
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={e => e.preventDefault()}
      className={`px-4 py-3 border-b select-none ${floor.isOwner ? 'bg-amber-50' : ''}`}
    >
      {/* 昵称 + 楼主标 + 楼层号 */}
      <div className="text-xs text-gray-500 mb-1">
        {floor.nickname && <span className="font-medium text-gray-700">{floor.nickname}</span>}
        {floor.isOwner && <span className="ml-1 text-amber-600">[楼主]</span>}
        <span className="float-right">{index + 1}楼</span>
      </div>

      {/* 引用块：多层竖排，每层取前 40 字 */}
      {floor.quotes.length > 0 && (
        <div className="border-l-2 border-gray-300 pl-2 text-xs text-gray-500 mb-1 space-y-1">
          {floor.quotes.map(qid => {
            const q = floors.find(f => f.id === qid)
            if (!q) return null
            return (
              <div key={qid}>
                {q.nickname || '匿名'}：{q.content.slice(0, 40)}
                {q.content.length > 40 ? '…' : ''}
              </div>
            )
          })}
        </div>
      )}

      {/* 正文 */}
      <div className="text-sm whitespace-pre-wrap break-words">{floor.content}</div>

      {/* 点赞数，受帖子统一设置控制 */}
      {showLikes && (
        <div className="text-xs text-gray-400 mt-1 text-right">👍 {floor.likes}</div>
      )}
    </div>
  )
}