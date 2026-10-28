import { resolveAvatarSrc } from './avatarPresets'

export function OwnerAvatar({ src }: { src: string }) {
  return src ? (
    <img src={resolveAvatarSrc(src)} alt="楼主头像" draggable={false}
      className="w-10 h-10 rounded-lg object-cover shrink-0" />
  ) : (
    <span className="w-10 h-10 rounded-lg bg-gray-200 text-gray-400 flex items-center justify-center shrink-0" aria-label="默认楼主头像">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2Z" />
      </svg>
    </span>
  )
}
