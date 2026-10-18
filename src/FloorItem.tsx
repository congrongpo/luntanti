import { useRef } from 'react'
import type { Floor } from './types'

type Props = {
  floor: Floor
  index: number
  floors: Floor[]
  showLikes: boolean
  onLongPress: (id: string) => void
}

export function FloorItem({ floor, index, floors, showLikes, onLongPress }: Props) {
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
      className="px-4 py-3.5 border-b border-gray-100 select-none bg-white"
    >
      {/* 第一行：楼层号 + 昵称 + 楼主标，字号提升到 14px */}
      <div className="text-[14px] text-gray-500 mb-2 flex items-center flex-wrap">
        <span className="font-medium text-gray-600 mr-2">{index + 1}楼</span>
        {floor.nickname && <span className="font-medium text-gray-700 mr-2">{floor.nickname}</span>}
        {floor.isOwner && (
          <span className="text-[12px] border border-amber-400 text-amber-500 px-1 rounded-sm leading-tight whitespace-nowrap">
            楼主
          </span>
        )}
      </div>

      {/* 引用块：字号提升到 14px */}
      {floor.quotes.length > 0 && (
        <div className="border border-gray-200 bg-gray-50 rounded p-2 text-[14px] text-gray-500 mb-2.5 space-y-1">
          {floor.quotes.map(qid => {
            const q = floors.find(f => f.id === qid)
            if (!q) return null
            return (
              <div key={qid} className="line-clamp-2">
                <span className="font-medium text-gray-600 mr-1">{q.nickname || '匿名'}:</span>
                {q.content}
              </div>
            )
          })}
        </div>
      )}

      {/* 第二行：正文，字号提升至 17px，行高舒适 */}
      <div className="text-[17px] text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{floor.content}</div>

      {/* 点赞数：字号 14px */}
      {showLikes && (
        <div className="text-[14px] text-gray-400 mt-2.5 flex justify-end items-center gap-1">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
          </svg>
          {floor.likes}
        </div>
      )}
    </div>
  )
}