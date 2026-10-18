// ---------- 类型 ----------
export type Floor = {
  id: string
  nickname: string
  content: string
  likes: number
  quotes: string[]
  isOwner: boolean
}

export type Post = {
  title: string
  nickname: string
  body: string
  boardName: string
  settings: {
    showLikes: boolean
  }
  floors: Floor[]
}

// ---------- 工厂 / 初始值 ----------
export const createFloor = (content: string): Floor => ({
  id: crypto.randomUUID(),
  nickname: '',
  content,
  likes: 0,
  quotes: [],
  isOwner: false,
})

export const initialPost: Post = {
  title: '',
  nickname: '',
  body: '',
  boardName: '',
  settings: { showLikes: true },
  floors: [],
}

// ---------- 楼层纯函数 ----------
export const updateFloor = (floors: Floor[], id: string, patch: Partial<Floor>) =>
  floors.map(f => (f.id === id ? { ...f, ...patch } : f))

export const deleteFloor = (floors: Floor[], id: string) =>
  floors
    .filter(f => f.id !== id)
    .map(f => ({ ...f, quotes: f.quotes.filter(q => q !== id) }))

export const moveFloorAbove = (floors: Floor[], fromId: string, targetId: string) => {
  if (fromId === targetId) return floors
  const moving = floors.find(f => f.id === fromId)
  if (!moving) return floors
  const rest = floors.filter(f => f.id !== fromId)
  const targetIndex = rest.findIndex(f => f.id === targetId)
  if (targetIndex === -1) return floors
  rest.splice(targetIndex, 0, moving)
  return rest
}

// 允许同时存在多个楼主（点击切换状态）
export const setOwner = (floors: Floor[], id: string) =>
  floors.map(f => (f.id === id ? { ...f, isOwner: !f.isOwner } : f))

export const randomizeLikes = (floors: Floor[]) =>
  floors.map(f => ({ ...f, likes: Math.floor(Math.random() * 100) }))

// 新增：点赞清零
export const clearLikes = (floors: Floor[]) =>
  floors.map(f => ({ ...f, likes: 0 }))

export const normalizePost = (data: any): Post => ({
  title: data?.title ?? '',
  nickname: data?.nickname ?? '',
  body: data?.body ?? '',
  boardName: data?.boardName ?? '',
  settings: { showLikes: data?.settings?.showLikes ?? true },
  floors: Array.isArray(data?.floors)
    ? data.floors.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        nickname: f.nickname ?? '',
        content: f.content ?? '',
        likes: f.likes ?? 0,
        quotes: Array.isArray(f.quotes) ? f.quotes : [],
        isOwner: !!f.isOwner,
      }))
    : [],
})