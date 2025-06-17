import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/birthday/', // Replace 'birthday' with your repository name
  plugins: [react()]
})