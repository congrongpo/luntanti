import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base 必须是 GitHub 仓库名，部署到 username.github.io/仓库名/ 时资源路径才对
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/luntanti/',
})