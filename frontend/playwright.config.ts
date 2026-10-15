import {defineConfig,devices} from '@playwright/test';
const frontendPort=Number(process.env.SOP_FRONTEND_PORT||5173);
const baseURL=`http://127.0.0.1:${frontendPort}`;
export default defineConfig({testDir:'./src/tests',timeout:30000,use:{baseURL,trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],webServer:{command:'npm run dev',url:baseURL,reuseExistingServer:!process.env.CI}});
