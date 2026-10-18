import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { toPng } from 'html-to-image'
import {
  type Post, type Floor, initialPost, normalizePost,
  createFloor, updateFloor, deleteFloor, moveFloorAbove,
  setOwner, randomizeLikes, clearLikes,
} from './types'
import { FloorItem } from './FloorItem'
import {
  ActionSheet, SingleFieldDialog, FloorPicker, LikesDialog, ScreenshotDialog,
  FLOOR_MENU_ITEMS, HEADER_MENU_ITEMS, type ScreenshotConfig,
} from './Dialogs'

type DialogState =
  | { type: 'floorMenu'; floorId: string }
  | { type: 'headerMenu' }
  | { type: 'editContent'; floorId: string }
  | { type: 'editNickname'; floorId: string }
  | { type: 'quote'; floorId: string }
  | { type: 'move'; floorId: string }
  | { type: 'likes'; floorId: string }
  | { type: 'insertAbove'; floorId: string }
  | { type: 'editTitle' }
  | { type: 'editOwnerName' }
  | { type: 'editBody' }
  | { type: 'editBoard' }
  | { type: 'screenshot' }
  | null

export default function App() {
  const [post, setPost] = useState<Post>(() => {
    try {
        const raw = localStorage.getItem('forum-post')
        return raw ? normalizePost(JSON.parse(raw)) : initialPost
    } catch {
        return initialPost
    }
  })

  const [draft, setDraft] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  const listRef = useRef<HTMLDivElement>(null)
  const headerTimer = useRef<number | null>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  
  // 输入框自适应高度相关
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const MAX_HEIGHT = 270 // 字号变大后，11行的高度上限适当提高

  useEffect(() => {
    localStorage.setItem('forum-post', JSON.stringify(post))
  }, [post])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [post.floors.length])

  // 动态调整输入框高度
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [draft])

  const add = () => {
    const content = draft.trim()
    if (!content) return
    if (!post.title) {
      setPost(p => ({ ...p, title: content }))
    } else {
      setPost(p => ({ ...p, floors: [...p.floors, createFloor(content)] }))
    }
    setDraft('')
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(post, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forum-post-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!data || !Array.isArray(data.floors)) {
          alert('文件格式不对，缺少 floors 数组')
          return
        }
        setPost(normalizePost(data))
      } catch {
        alert('JSON 解析失败，请确认文件内容')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const clearPost = () => {
    const confirmed = window.confirm('⚠️ 危险操作：\n\n确定要清空整篇帖子吗？\n\n清空后无法撤销，请注意先导出 JSON 备份！')
    if (confirmed) {
      setPost(initialPost)
      localStorage.removeItem('forum-post')
      setDraft('')
    }
  }

  const onFloorAction = (key: string, floorId: string) => {
    setDialog(null)
    if (key === 'delete') {
      setPost(p => ({ ...p, floors: deleteFloor(p.floors, floorId) }))
      return
    }
    if (key === 'owner') {
      setPost(p => ({ ...p, floors: setOwner(p.floors, floorId) }))
      return
    }
    if (key === 'insertAbove') setDialog({ type: 'insertAbove', floorId })
    if (key === 'editContent') setDialog({ type: 'editContent', floorId })
    if (key === 'editNickname') setDialog({ type: 'editNickname', floorId })
    if (key === 'quote') setDialog({ type: 'quote', floorId })
    if (key === 'move') setDialog({ type: 'move', floorId })
    if (key === 'likes') setDialog({ type: 'likes', floorId })
  }

  const onHeaderAction = (key: string) => {
    setDialog(null)
    if (key === 'title') setDialog({ type: 'editTitle' })
    if (key === 'nickname') setDialog({ type: 'editOwnerName' })
    if (key === 'body') setDialog({ type: 'editBody' })
    if (key === 'board') setDialog({ type: 'editBoard' })
  }

  const takeScreenshot = async (config: ScreenshotConfig) => {
    setDialog(null)
    const { keepHeader, startFloor, endFloor, floorsPerShot } = config
    const selected = post.floors.slice(startFloor, endFloor + 1)
    if (selected.length === 0) return

    const actualWidth = phoneRef.current?.offsetWidth || 390

    const host = document.createElement('div')
    host.style.cssText = `position:absolute; top:0; left:0; z-index:-1; width:${actualWidth}px; background:#fff; opacity:0.01; pointer-events:none;`
    document.body.appendChild(host)
    const root = createRoot(host)

    const chunks: Floor[][] = []
    for (let i = 0; i < selected.length; i += floorsPerShot) {
      chunks.push(selected.slice(i, i + floorsPerShot))
    }

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx]
      
      flushSync(() => {
        root.render(
          <div style={{ padding: '16px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' }}>
            {keepHeader && idx === 0 && (
              <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#888' }}>{post.nickname || '楼主'}</div>
                  {post.boardName && <div style={{ fontSize: '13px', color: '#888', backgroundColor: '#f3f4f6', padding: '0 4px', borderRadius: '2px' }}>{post.boardName}</div>}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '22px', marginBottom: '8px', color: '#000' }}>{post.title}</div>
                {post.body && (
                  <div style={{ fontSize: '17px', whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.6 }}>{post.body}</div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginTop: '14px', marginBottom: '6px', color: '#333' }}>回帖区</div>
              </div>
            )}
            {chunk.map(floor => {
              const originalIndex = post.floors.findIndex(f => f.id === floor.id)
              return (
                <FloorItem key={floor.id} floor={floor} index={originalIndex}
                  floors={post.floors} showLikes={post.settings.showLikes}
                  onLongPress={() => {}} />
              )
            })}
          </div>
        )
      })
      
      await new Promise(r => setTimeout(r, 200))

      try {
        const dataUrl = await toPng(host, { 
          pixelRatio: 2, 
          backgroundColor: '#fff',
          style: { opacity: '1' },
          width: actualWidth 
        })
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `forum-${idx + 1}.png`
        a.click()
      } catch (err) {
        console.error('截图失败', err)
        alert('截图失败，请重试')
      }
      
      await new Promise(r => setTimeout(r, 300))
    }

    root.unmount()
    document.body.removeChild(host)
  }

  const targetFloor = (id: string) => post.floors.find(f => f.id === id)

  const onHeaderPointerDown = () => {
    headerTimer.current = window.setTimeout(() => setDialog({ type: 'headerMenu' }), 500)
  }
  const onHeaderPointerUp = () => {
    if (headerTimer.current) clearTimeout(headerTimer.current)
  }

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div ref={phoneRef} className="w-full max-w-[390px] bg-white h-screen flex flex-col shadow-xl overflow-hidden">
        
        {/* 顶栏 */}
        <div className="shrink-0 z-20 bg-white border-b px-4 py-2.5 flex items-center justify-between">
          <div className="text-[16px] font-medium truncate text-gray-700">论坛体写作器</div>
          <button onClick={() => setShowSettings(s => !s)} className="text-xl px-2">⚙️</button>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="shrink-0 z-20 border-b p-4 space-y-2.5 text-[15px] bg-gray-50">
            <label className="flex justify-between items-center">
              显示点赞数
              <input type="checkbox" className="w-4 h-4" checked={post.settings.showLikes}
                onChange={e => setPost(p => ({ ...p, settings: { ...p.settings, showLikes: e.target.checked } }))} />
            </label>
            <button onClick={() => setPost(p => ({ ...p, floors: randomizeLikes(p.floors) }))}
              className="w-full py-2 border rounded bg-white">随机设置所有点赞数</button>
            <button onClick={() => setPost(p => ({ ...p, floors: clearLikes(p.floors) }))}
              className="w-full py-2 border rounded bg-white text-gray-600">点赞数清零</button>
            <button onClick={() => setDialog({ type: 'screenshot' })}
              className="w-full py-2 border rounded bg-white">开始截图</button>
            <button onClick={exportJSON} className="w-full py-2 border rounded bg-white">导出 JSON</button>
            <label className="w-full py-2 border rounded bg-white text-center cursor-pointer block">
              导入 JSON
              <input type="file" accept=".json,application/json" onChange={importJSON} className="hidden" />
            </label>
            <button onClick={clearPost} className="w-full py-2 border border-red-200 text-red-500 rounded bg-white mt-4">
              清空当前帖子
            </button>
          </div>
        )}

        {/* 帖子列表 */}
        <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar">
          
          {/* 帖子本体 */}
          <div
            onPointerDown={onHeaderPointerDown}
            onPointerUp={onHeaderPointerUp}
            onPointerLeave={onHeaderPointerUp}
            onContextMenu={e => e.preventDefault()}
            className="px-4 py-3.5 border-b border-gray-100 bg-gray-50 select-none"
          >
            {/* 楼主 + 版面 */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-[14px] text-gray-500">
                {post.nickname || '楼主'}
              </div>
              {post.boardName && (
                <span className="text-[13px] text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded">
                  {post.boardName}
                </span>
              )}
            </div>
            
            {/* 标题 22px */}
            <div className="text-[22px] font-bold mb-2.5 break-words text-gray-900 leading-snug">
              {post.title || '未命名帖子'}
            </div>
            
            {/* 正文 17px */}
            <div className="text-[17px] whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
              {post.body || '（长按编辑帖子正文）'}
            </div>
          </div>

          <div className="px-4 py-2.5 font-bold text-[16px] text-gray-700 bg-white border-b border-gray-100">
            回帖区
          </div>

          {/* 楼层列表 */}
          {post.floors.map((f, i) => (
            <FloorItem key={f.id} floor={f} index={i} floors={post.floors}
              showLikes={post.settings.showLikes}
              onLongPress={id => setDialog({ type: 'floorMenu', floorId: id })} />
          ))}

          {post.floors.length === 0 && (
            <div className="text-center text-[14px] text-gray-400 py-10">
              还没有回帖，在下面输入框发送第一条
            </div>
          )}
        </div>

        {/* 底部输入框 */}
        <div className="shrink-0 z-20 bg-white border-t p-2.5 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() }
            }}
            placeholder={!post.title ? '添加帖子标题' : '写点什么…'}
            className="flex-1 border rounded px-3 py-2.5 text-[17px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden leading-relaxed"
            style={{ minHeight: '46px' }}
          />
          <button 
            onClick={add} 
            className="px-4 py-2.5 bg-blue-500 text-white rounded text-[16px] whitespace-nowrap mb-[1px]"
          >
            {!post.title ? '设置标题' : '发送'}
          </button>
        </div>

        {/* 弹窗部分 */}
        {dialog?.type === 'floorMenu' && (
          <ActionSheet items={FLOOR_MENU_ITEMS} onClose={() => setDialog(null)} onAction={key => onFloorAction(key, dialog.floorId)} />
        )}
        {dialog?.type === 'headerMenu' && (
          <ActionSheet items={HEADER_MENU_ITEMS} onClose={() => setDialog(null)} onAction={onHeaderAction} />
        )}
        {dialog?.type === 'editTitle' && (
          <SingleFieldDialog label="修改标题" value={post.title} onSave={v => setPost(p => ({ ...p, title: v.trim() }))} onClose={() => setDialog(null)} />
        )}
        {dialog?.type === 'editOwnerName' && (
          <SingleFieldDialog label="修改楼主名称（留空则不显示）" value={post.nickname} onSave={v => setPost(p => ({ ...p, nickname: v.trim() }))} onClose={() => setDialog(null)} />
        )}
        {dialog?.type === 'editBody' && (
          <SingleFieldDialog label="修改正文" value={post.body} multiline onSave={v => setPost(p => ({ ...p, body: v }))} onClose={() => setDialog(null)} />
        )}
        {dialog?.type === 'editBoard' && (
          <SingleFieldDialog label="修改版面（留空则不显示）" value={post.boardName} onSave={v => setPost(p => ({ ...p, boardName: v.trim() }))} onClose={() => setDialog(null)} />
        )}

        {dialog?.type === 'insertAbove' && (
          <SingleFieldDialog label="输入要插入到上方的内容" value="" multiline
            onSave={v => {
              if (!v.trim()) return
              setPost(p => {
                const idx = p.floors.findIndex(f => f.id === dialog.floorId)
                if (idx === -1) return p
                const newFloors = [...p.floors]
                newFloors.splice(idx, 0, createFloor(v.trim()))
                return { ...p, floors: newFloors }
              })
            }}
            onClose={() => setDialog(null)} />
        )}

        {dialog?.type === 'editContent' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return <SingleFieldDialog label="修改内容" value={f.content} multiline onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { content: v }) }))} onClose={() => setDialog(null)} />
        })()}
        {dialog?.type === 'editNickname' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return <SingleFieldDialog label="修改昵称（留空则不显示）" value={f.nickname} onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { nickname: v.trim() }) }))} onClose={() => setDialog(null)} />
        })()}
        
        {dialog?.type === 'quote' && (() => {
          const currentIndex = post.floors.findIndex(x => x.id === dialog.floorId)
          if (currentIndex === -1) return null
          const availableFloors = post.floors.slice(0, currentIndex)
          if (availableFloors.length === 0) {
            alert('上方没有楼层可以引用')
            setDialog(null)
            return null
          }
          return (
            <FloorPicker 
              title="选择要引用的楼层（可多选）" 
              floors={availableFloors} 
              multiple 
              selected={post.floors[currentIndex].quotes} 
              onClose={() => setDialog(null)} 
              onConfirm={ids => setPost(p => ({ ...p, floors: updateFloor(p.floors, post.floors[currentIndex].id, { quotes: ids }) }))} 
            />
          )
        })()}

        {dialog?.type === 'move' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return <FloorPicker title="选择目标楼层，本层将移到它之上" floors={post.floors.filter(x => x.id !== f.id)} multiple={false} onClose={() => setDialog(null)} onConfirm={ids => { if (ids[0]) setPost(p => ({ ...p, floors: moveFloorAbove(p.floors, f.id, ids[0]) })) }} />
        })()}
        {dialog?.type === 'likes' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return <LikesDialog value={f.likes} onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { likes: v }) }))} onClose={() => setDialog(null)} />
        })()}
        {dialog?.type === 'screenshot' && (
          <ScreenshotDialog totalFloors={post.floors.length} onStart={takeScreenshot} onClose={() => setDialog(null)} />
        )}
      </div>
    </div>
  )
}