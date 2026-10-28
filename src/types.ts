export type Floor = {
  id: string
  nickname: string
  content: string
  images: string[]
  imageWidths: (number | null)[]
  likes: number
  quotes: string[]
  isOwner: boolean
}

export type Post = {
  avatar: string
  title: string
  nickname: string
  body: string
  boardName: string
  settings: {
    showLikes: boolean
    likesPosition: 'left' | 'right'
    fontSizeTitle: number
    fontSizeBody: number
    fontSizeSub: number
  }
  floors: Floor[]
}

export const createFloor = (content: string): Floor => ({
  id: crypto.randomUUID(),
  nickname: '',
  content,
  images: [],
  imageWidths: [],
  likes: 0,
  quotes: [],
  isOwner: false,
})

export const initialPost: Post = {
  avatar: '',
  title: '',
  nickname: '',
  body: '',
  boardName: '',
  settings: { 
    showLikes: true,
    likesPosition: 'right',
    fontSizeTitle: 19,
    fontSizeBody: 17,
    fontSizeSub: 14,
  },
  floors: [],
}

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

export const setOwner = (floors: Floor[], id: string) =>
  floors.map(f => (f.id === id ? { ...f, isOwner: !f.isOwner } : f))

export const randomizeLikes = (floors: Floor[]) =>
  floors.map(f => ({ ...f, likes: Math.floor(Math.random() * 100) }))

export const clearLikes = (floors: Floor[]) =>
  floors.map(f => ({ ...f, likes: 0 }))

export const normalizeImageWidth = (width: unknown): number | null =>
  typeof width === 'number' && Number.isFinite(width) && width > 0
    ? Math.max(1, Math.min(10000, Math.round(width)))
    : null

const normalizeFloorImages = (floor: { images?: unknown; imageWidths?: unknown }) => {
  const images: string[] = []
  const imageWidths: (number | null)[] = []
  if (Array.isArray(floor.images)) {
    floor.images.forEach((image: unknown, index: number) => {
      if (typeof image !== 'string') return
      images.push(image)
      imageWidths.push(normalizeImageWidth(Array.isArray(floor.imageWidths) ? floor.imageWidths[index] : null))
    })
  }
  return { images, imageWidths }
}

export const normalizePost = (data: any): Post => ({
  avatar: typeof data?.avatar === 'string' ? data.avatar : '',
  title: data?.title ?? '',
  nickname: data?.nickname ?? '',
  body: data?.body ?? '',
  boardName: data?.boardName ?? '',
  settings: { 
    showLikes: data?.settings?.showLikes ?? true,
    likesPosition: data?.settings?.likesPosition === 'left' ? 'left' : 'right',
    fontSizeTitle: data?.settings?.fontSizeTitle ?? 22,
    fontSizeBody: data?.settings?.fontSizeBody ?? 17,
    fontSizeSub: data?.settings?.fontSizeSub ?? 14,
  },
  floors: Array.isArray(data?.floors)
    ? data.floors.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        nickname: f.nickname ?? '',
        content: f.content ?? '',
        ...normalizeFloorImages(f),
        likes: f.likes ?? 0,
        quotes: Array.isArray(f.quotes) ? f.quotes : [],
        isOwner: !!f.isOwner,
      }))
    : [],
})
