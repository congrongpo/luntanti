import { useRef } from 'react'
import type { Floor, Post } from './types'

type Props = {
  floor: Floor
  index: number
  floors: Floor[]
  settings: Post['settings']
  onLongPress: (id: string) => void
}

export function FloorItem({ floor, index, floors, settings, onLongPress }: Props) {
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
      {/* 第一行：楼层号 + 昵称 + 楼主标 */}
      <div className="text-gray-500 mb-2 flex items-center flex-wrap" style={{ fontSize: `${settings.fontSizeSub}px` }}>
        <span className="font-medium text-gray-600 mr-2">{index + 1}楼</span>
        {floor.nickname && <span className="font-medium text-gray-700 mr-2">{floor.nickname}</span>}
        {floor.isOwner && (
          <span 
            className="border border-amber-400 text-amber-500 px-1.5 rounded-full leading-tight whitespace-nowrap bg-amber-50"
            style={{ fontSize: `${settings.fontSizeSub - 2}px` }}
          >
            楼主
          </span>
        )}
      </div>

      {/* 引用块 */}
      {floor.quotes.length > 0 && (
        <div 
          className="bg-gray-100 rounded-lg p-3 text-gray-500 mb-3 space-y-1"
          style={{ fontSize: `${settings.fontSizeSub}px` }}
        >
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

      {/* 第二行：正文 */}
      <div 
        className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed"
        style={{ fontSize: `${settings.fontSizeBody}px` }}
      >
        {floor.content}
      </div>

      {/* 点赞数 */}
      {settings.showLikes && (
        <div className="text-gray-400 mt-3 flex justify-end items-center gap-1" style={{ fontSize: `${settings.fontSizeSub}px` }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
          </svg>
          {floor.likes}
        </div>
      )}
    </div>
  )
}