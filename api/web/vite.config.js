import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig((configEnv) => ({
    plugins: [
        vue(),
    ],
    optimizeDeps: {
        include: ["showdown", "@tak-ps/vue-tabler"],
    },
    server: {
        port: 8080,
    }
}))

