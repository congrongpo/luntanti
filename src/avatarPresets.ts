const colors = [
  { name: '蓝色', background: '#dbeafe', foreground: '#60a5fa' },
  { name: '绿色', background: '#dcfce7', foreground: '#4ade80' },
  { name: '橙色', background: '#ffedd5', foreground: '#fb923c' },
  { name: '粉色', background: '#fce7f3', foreground: '#f472b6' },
  { name: '紫色', background: '#f3e8ff', foreground: '#c084fc' },
  { name: '青色', background: '#ccfbf1', foreground: '#2dd4bf' },
]

export const avatarPresets = [
  { name: '灰色', src: '' },
  ...colors.map(({ name, background, foreground }) => ({
    name,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${background}"/><g transform="translate(5 5) scale(1.25)" fill="${foreground}"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></g></svg>`,
    )}`,
  })),
]
