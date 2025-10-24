import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // 设置根目录为 exampleTest
    root: 'exampleTest',

    server: {
        port: 3000,          // 开发服务器端口
        open: '/spa.html',   // 启动时自动打开 spa.html
        strictPort: true     // 如果端口被占用则直接报错
    },

    build: {
        rollupOptions: {
            // 多页面入口配置
            input: {
                spa: resolve(__dirname, 'exampleTest/spa.html'),
                mpa: resolve(__dirname, 'exampleTest/mpa.html')
            }
        },
        outDir: '../dist-example', // 构建输出目录（相对于 root）
        emptyOutDir: true          // 构建前清空输出目录
    },

    // 允许在 HTML 中直接 import TS 源码
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
});