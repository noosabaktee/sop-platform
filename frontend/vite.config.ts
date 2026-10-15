import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const backendTarget=process.env.SOP_BACKEND_URL||'http://127.0.0.1:8000';
const frontendPort=Number(process.env.SOP_FRONTEND_PORT||5173);
export default defineConfig({plugins:[react()],server:{host:'0.0.0.0',port:frontendPort,proxy:{'/api':{target:backendTarget,changeOrigin:true},'/sanctum':{target:backendTarget,changeOrigin:true}}}});
