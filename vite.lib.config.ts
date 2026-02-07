import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'FrontendMonitor',
            fileName: (format) => `frontend-monitor-sdk.${format}.js`
        },
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: ['rrweb', '@rrweb/types'],
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals: {
                    rrweb: 'rrweb'
                }
            }
        },
        outDir: 'dist',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            'src': resolve(__dirname, 'src'),
            'plugins': resolve(__dirname, 'src/plugins')
        }
    },
    plugins: [
        // 生成 .d.ts 类型文件
        dts({
            insertTypesEntry: true,
        })
    ]
});
