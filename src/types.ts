// ---------- 类型 ----------

export type Floor = {
  id: string
  nickname: string      // 空字符串表示不显示昵称
  content: string
  likes: number
  quotes: string[]      // 引用的楼层 id，支持多层
  isOwner: boolean      // 是否为楼主回复
}

export type Post = {
  title: string
  nickname: string      // 楼主名称，可空
  body: string          // 楼主正文，不是楼层
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
  boardName: '树洞',
  settings: { showLikes: true },
  floors: [],
}

// ---------- 楼层纯函数（输入输出都是新数组，方便在 App 里 setPost） ----------

// 改某一层的部分字段
export const updateFloor = (floors: Floor[], id: string, patch: Partial<Floor>) =>
  floors.map(f => (f.id === id ? { ...f, ...patch } : f))

// 删除楼层，同时清理其他楼层里对该层的引用
export const deleteFloor = (floors: Floor[], id: string) =>
  floors
    .filter(f => f.id !== id)
    .map(f => ({ ...f, quotes: f.quotes.filter(q => q !== id) }))

// 把 fromId 移到 targetId 之上
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

// 设为楼主，互斥：只有一层能是楼主
export const setOwner = (floors: Floor[], id: string) =>
  floors.map(f => ({ ...f, isOwner: f.id === id }))

// 给所有楼层随机点赞数 0-99
export const randomizeLikes = (floors: Floor[]) =>
  floors.map(f => ({ ...f, likes: Math.floor(Math.random() * 100) }))

// 导入 JSON 时补默认字段，兼容旧文件
export const normalizePost = (data: any): Post => ({
  title: data?.title ?? '',
  nickname: data?.nickname ?? '',
  body: data?.body ?? '',
  boardName: data?.boardName ?? '树洞',
  settings: { showLikes: data?.settings?.showLikes ?? true },
  floors: Array.isArray(data?.floors)
    ? data.floors.map((f: any) => ({
        id: f.id ?? crypto.randomUUID(),
        nickname: f.nickname ?? '',
        content: f.content ?? '',
        likes: f.likes ?? 0,
        quotes: Array.isArray(f.quotes) ? f.quotes : [],
        isOwner: !!f.isOwner,
      }))
    : [],
})