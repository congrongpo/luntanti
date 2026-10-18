import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { toPng } from 'html-to-image'
import {
  type Post, type Floor, initialPost, normalizePost,
  createFloor, updateFloor, deleteFloor, moveFloorAbove,
  setOwner, randomizeLikes,
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
  | { type: 'editTitle' }
  | { type: 'editOwnerName' }
  | { type: 'editBody' }
  | { type: 'screenshot' }
  | null

export default function App() {
  // ---------- 帖子状态：初始化时从 localStorage 读 ----------
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

  // 每次 post 变化自动写回 localStorage
  useEffect(() => {
    localStorage.setItem('forum-post', JSON.stringify(post))
  }, [post])

  // 楼层增加时滚到底部
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [post.floors.length])

  // ---------- 底部输入框：标题为空时写标题，否则追加楼层 ----------
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

  // ---------- 导出 / 导入 JSON ----------
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

  // ---------- 楼层菜单动作分发 ----------
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
    if (key === 'editContent') setDialog({ type: 'editContent', floorId })
    if (key === 'editNickname') setDialog({ type: 'editNickname', floorId })
    if (key === 'quote') setDialog({ type: 'quote', floorId })
    if (key === 'move') setDialog({ type: 'move', floorId })
    if (key === 'likes') setDialog({ type: 'likes', floorId })
  }

  // ---------- 正文菜单动作分发 ----------
  const onHeaderAction = (key: string) => {
    setDialog(null)
    if (key === 'title') setDialog({ type: 'editTitle' })
    if (key === 'nickname') setDialog({ type: 'editOwnerName' })
    if (key === 'body') setDialog({ type: 'editBody' })
  }

  // ---------- 截图 ----------
  const takeScreenshot = async (config: ScreenshotConfig) => {
    setDialog(null)
    const { keepHeader, startFloor, endFloor, floorsPerShot } = config
    const selected = post.floors.slice(startFloor, endFloor + 1)
    if (selected.length === 0) return

    // 屏幕外容器，宽度和手机界面一致
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-99999px;top:0;width:390px;background:#fff;'
    document.body.appendChild(host)
    const root = createRoot(host)

    // 按每张层数切段
    const chunks: Floor[][] = []
    for (let i = 0; i < selected.length; i += floorsPerShot) {
      chunks.push(selected.slice(i, i + floorsPerShot))
    }

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx]
      flushSync(() => {
        root.render(
          <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
            {/* 第一张图按开关决定是否带帖子开头 */}
            {keepHeader && idx === 0 && (
              <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{post.title}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {post.nickname || '楼主'} · {post.boardName}
                </div>
                {post.body && (
                  <div style={{ fontSize: 14, marginTop: 8, whiteSpace: 'pre-wrap' }}>{post.body}</div>
                )}
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
      // 等一帧让 DOM 稳定
      await new Promise(r => requestAnimationFrame(() => r(null)))
      const dataUrl = await toPng(host, { pixelRatio: 2, backgroundColor: '#fff' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `forum-${idx + 1}.png`
      a.click()
      // 间隔一下，避免浏览器拦截连续下载
      await new Promise(r => setTimeout(r, 300))
    }

    root.unmount()
    document.body.removeChild(host)
  }

  // 当前正在操作的楼层（弹窗用）
  const targetFloor = (id: string) => post.floors.find(f => f.id === id)

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-[390px] bg-white min-h-screen flex flex-col shadow-xl">

        {/* ---------- 顶栏 ---------- */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="text-sm font-medium truncate">{post.title || '未命名帖子'}</div>
          <button onClick={() => setShowSettings(s => !s)} className="text-xl px-2">⚙️</button>
        </div>

        {/* ---------- 设置面板 ---------- */}
        {showSettings && (
          <div className="border-b p-4 space-y-2 text-sm bg-gray-50">
            <label className="flex justify-between items-center">
              显示点赞数
              <input type="checkbox" checked={post.settings.showLikes}
                onChange={e => setPost(p => ({ ...p, settings: { ...p.settings, showLikes: e.target.checked } }))} />
            </label>
            <button onClick={() => setPost(p => ({ ...p, floors: randomizeLikes(p.floors) }))}
              className="w-full py-2 border rounded bg-white">随机设置所有点赞数</button>
            <button onClick={() => setDialog({ type: 'screenshot' })}
              className="w-full py-2 border rounded bg-white">开始截图</button>
            <button onClick={exportJSON} className="w-full py-2 border rounded bg-white">导出 JSON</button>
            <label className="w-full py-2 border rounded bg-white text-center cursor-pointer block">
              导入 JSON
              <input type="file" accept=".json,application/json" onChange={importJSON} className="hidden" />
            </label>
          </div>
        )}

        {/* ---------- 滚动区：楼主正文 + 楼层列表 ---------- */}
        <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar">

          {/* 楼主正文区：长按可改标题/楼主名称/正文 */}
          <div
            onPointerDown={() => {
              const t = window.setTimeout(() => setDialog({ type: 'headerMenu' }), 500)
              // 用局部变量存 timer，抬起时清掉
              ;(window as any).__headerTimer = t
            }}
            onPointerUp={() => clearTimeout((window as any).__headerTimer)}
            onPointerLeave={() => clearTimeout((window as any).__headerTimer)}
            onContextMenu={e => e.preventDefault()}
            className="px-4 py-3 border-b bg-gray-50 select-none"
          >
            <div className="text-xs text-gray-500 mb-1">{post.nickname || '楼主'}</div>
            <div className="text-sm whitespace-pre-wrap break-words">
              {post.body || '（长按编辑帖子正文）'}
            </div>
          </div>

          {/* 楼层列表 */}
          {post.floors.map((f, i) => (
            <FloorItem key={f.id} floor={f} index={i} floors={post.floors}
              showLikes={post.settings.showLikes}
              onLongPress={id => setDialog({ type: 'floorMenu', floorId: id })} />
          ))}

          {post.floors.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-8">
              还没有楼层，在下面输入框发送第一条回复
            </div>
          )}
        </div>

        {/* ---------- 底部输入框 ---------- */}
        <div className="border-t p-2 flex gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() }
            }}
            rows={1}
            placeholder={!post.title ? '添加帖子标题' : '写点什么…'}
            className="flex-1 border rounded px-2 py-1 text-sm resize-none"
          />
          <button onClick={add} className="px-3 bg-blue-500 text-white rounded text-sm">
            {!post.title ? '设置标题' : '发送'}
          </button>
        </div>

        {/* ---------- 弹层 ---------- */}

        {/* 楼层长按菜单 */}
        {dialog?.type === 'floorMenu' && (
          <ActionSheet
            items={FLOOR_MENU_ITEMS}
            onClose={() => setDialog(null)}
            onAction={key => onFloorAction(key, dialog.floorId)}
          />
        )}

        {/* 正文长按菜单 */}
        {dialog?.type === 'headerMenu' && (
          <ActionSheet
            items={HEADER_MENU_ITEMS}
            onClose={() => setDialog(null)}
            onAction={onHeaderAction}
          />
        )}

        {/* 改标题 */}
        {dialog?.type === 'editTitle' && (
          <SingleFieldDialog label="修改标题" value={post.title}
            onSave={v => setPost(p => ({ ...p, title: v.trim() }))}
            onClose={() => setDialog(null)} />
        )}

        {/* 改楼主名称 */}
        {dialog?.type === 'editOwnerName' && (
          <SingleFieldDialog label="修改楼主名称（留空则不显示）" value={post.nickname}
            onSave={v => setPost(p => ({ ...p, nickname: v.trim() }))}
            onClose={() => setDialog(null)} />
        )}

        {/* 改正文 */}
        {dialog?.type === 'editBody' && (
          <SingleFieldDialog label="修改正文" value={post.body} multiline
            onSave={v => setPost(p => ({ ...p, body: v }))}
            onClose={() => setDialog(null)} />
        )}

        {/* 改楼层内容 */}
        {dialog?.type === 'editContent' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return (
            <SingleFieldDialog label="修改内容" value={f.content} multiline
              onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { content: v }) }))}
              onClose={() => setDialog(null)} />
          )
        })()}

        {/* 改楼层昵称 */}
        {dialog?.type === 'editNickname' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return (
            <SingleFieldDialog label="修改昵称（留空则不显示）" value={f.nickname}
              onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { nickname: v.trim() }) }))}
              onClose={() => setDialog(null)} />
          )
        })()}

        {/* 引用楼层（多选） */}
        {dialog?.type === 'quote' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return (
            <FloorPicker
              title="选择要引用的楼层（可多选）"
              floors={post.floors}
              multiple
              selected={f.quotes}
              onClose={() => setDialog(null)}
              onConfirm={ids => setPost(p => ({
                ...p,
                floors: updateFloor(p.floors, f.id, { quotes: ids }),
              }))}
            />
          )
        })()}

        {/* 移动到某层之上（单选） */}
        {dialog?.type === 'move' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return (
            <FloorPicker
              title="选择目标楼层，本层将移到它之上"
              floors={post.floors.filter(x => x.id !== f.id)}
              multiple={false}
              onClose={() => setDialog(null)}
              onConfirm={ids => {
                if (ids[0]) {
                  setPost(p => ({ ...p, floors: moveFloorAbove(p.floors, f.id, ids[0]) }))
                }
              }}
            />
          )
        })()}

        {/* 改点赞数 */}
        {dialog?.type === 'likes' && (() => {
          const f = targetFloor(dialog.floorId)
          if (!f) return null
          return (
            <LikesDialog value={f.likes}
              onSave={v => setPost(p => ({ ...p, floors: updateFloor(p.floors, f.id, { likes: v }) }))}
              onClose={() => setDialog(null)} />
          )
        })()}

        {/* 截图设置 */}
        {dialog?.type === 'screenshot' && (
          <ScreenshotDialog
            totalFloors={post.floors.length}
            onStart={takeScreenshot}
            onClose={() => setDialog(null)}
          />
        )}
      </div>
    </div>
  )
}