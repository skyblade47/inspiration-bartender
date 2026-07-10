import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native/Libraries/Renderer/shims/ReactNative': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.mjs'],
  },
  define: {
    global: 'window',
    __DEV__: 'false',
  },
  server: {
    port: 8084,
    host: true,
  },
  build: {
    outDir: 'dist-web',
  },
})
