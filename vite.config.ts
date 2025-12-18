import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前目录下的所有环境变量
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Try to find the key in various common casings
  const apiKey = env.API_KEY || env.api_key || env.ApiKey || process.env.API_KEY;

  if (apiKey) {
    console.log("\n✅ [Vite Config] API_KEY detected successfully!");
    console.log(`   Key length: ${apiKey.length} characters`);
    console.log(`   Key starts with: ${apiKey.substring(0, 4)}...\n`);
  } else {
    console.warn("\n⚠️ [Vite Config] API_KEY NOT detected!");
    console.warn("   Make sure .env file exists or system variable is set.\n");
  }

  return {
    plugins: [react()],
    define: {
      // 强力注入：无论代码里写 process.env.API_KEY 还是 import.meta.env.API_KEY 都能拿到
      'process.env.API_KEY': JSON.stringify(apiKey),
      'import.meta.env.API_KEY': JSON.stringify(apiKey),
    },
    server: {
      host: true,
      open: true
    }
  };
});