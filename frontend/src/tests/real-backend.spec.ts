import {test,expect,type Page} from '@playwright/test';

const nodeEnv=(globalThis as unknown as {process?:{env:Record<string,string|undefined>}}).process?.env||{};
const enabled=nodeEnv.SOP_REAL_E2E==='1';
const credentials={
  email:nodeEnv.SOP_E2E_EMAIL||'admin@sop.local',
  password:nodeEnv.SOP_E2E_PASSWORD||'ChangeMe-2026!',
};
const routes=[
  '/overview','/my-workspace','/dashboard','/crm-sales','/business-development',
  '/quotation','/sales','/projects','/purchase','/inventory','/finance','/reports',
  '/management','/master-data','/document-management','/document-template',
  '/email-communication','/omnichannel','/whatsapp-integration','/general-meeting-rups',
  '/workflow-approval','/corporate','/ai-assistant','/data-intelligence','/integrations',
  '/security-audit','/settings',
];

async function login(page:Page){
  await page.goto('/#/login');
  await expect(page.locator('[data-page-id="login"] [data-form="login"]')).toBeVisible();
  await page.locator('[data-page-id="login"] #email').fill(credentials.email);
  await page.locator('[data-page-id="login"] #password').fill(credentials.password);
  await page.locator('[data-page-id="login"] [data-form="login"] button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/overview$/, {timeout:30_000});
  await expect(page.locator('[data-prototype-page][data-route="/overview"]')).toBeVisible({timeout:30_000});
}

async function gridReady(page:Page){
  await expect.poll(()=>page.evaluate(()=>{
    const bridge=(window as unknown as {SOPBridge?:{mountedCount:number;isReady:boolean}}).SOPBridge;
    return Boolean(bridge?.mountedCount&&bridge.isReady);
  }),{timeout:60_000}).toBe(true);
}

test.describe('real Laravel + PostgreSQL browser flow',()=>{
  test.skip(!enabled,'Set SOP_REAL_E2E=1 and run Laravel against the isolated test database.');

  test('login, CRM workflow, SQL dashboards/workspace, all 27 routes, and logout',async({page})=>{
    test.setTimeout(180_000);
    const serverErrors:string[]=[];
    const pageErrors:string[]=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('response',response=>{
      if(response.url().includes('/api/')&&response.status()>=500){
        serverErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });

    await login(page);
    const overview=page.locator('[data-prototype-page][data-route="/overview"]');
    await expect(overview.getByText('Quotation diajukan',{exact:true})).toHaveCount(0,{timeout:30_000});
    await expect(overview.getByText('Q-2026-014',{exact:true})).toHaveCount(0);
    await page.evaluate(()=>{location.hash='#/crm-sales'});
    await gridReady(page);
    const cell=page.locator('[data-page-id="crm-sales"] [data-crm-panel="leads"] .crm-cell').first();
    await expect(cell).toBeVisible();
    const marker=`E2E PostgreSQL ${Date.now()}`;
    const companyMarker=`PT E2E ${Date.now()}`;
    const field=await cell.getAttribute('data-crm-key');
    expect(field).toBeTruthy();
    const rowId=await cell.getAttribute('data-crm-id');
    expect(rowId).toBeTruthy();
    await cell.fill(marker);
    await page.locator(`[data-page-id="crm-sales"] [data-crm-panel="leads"] .crm-cell[data-crm-id="${rowId}"][data-crm-key="company"]`).fill(companyMarker);
    await page.locator('[data-page-id="crm-sales"] [data-crm-panel="leads"] [data-crm-act="commit"]').click();
    await expect.poll(()=>page.evaluate(({key,value})=>{
      const bridge=(window as unknown as {SOPBridge?:{getPendingRows:(route:string,panel:string)=>{rows:Record<string,unknown>[];staged:string[]}}}).SOPBridge;
      const pending=bridge?.getPendingRows('/crm-sales','leads');
      return pending?.staged.length===0&&pending.rows[0]?.[key]===value;
    },{key:field!,value:marker})).toBe(true);
    // Await the same public persistence path used by the debounced native event
    // bridge. This removes timer races while still exercising Laravel and SQL.
    await page.evaluate(async()=>{
      const bridge=(window as unknown as {SOPBridge:{persistRoute:(route:string,panel:string)=>Promise<void>}}).SOPBridge;
      await bridge.persistRoute('/crm-sales','leads');
    });
    await page.reload();
    await expect(page.locator('[data-page-id="crm-sales"] .crm-cell').first()).toHaveValue(marker,{timeout:30_000});

    page.once('dialog',dialog=>dialog.accept());
    await page.locator(`[data-page-id="crm-sales"] [data-crm-panel="leads"] [data-crm-act="convert"][data-crm-id="${rowId}"]`).click();
    await expect(page.locator(`[data-page-id="crm-sales"] [data-crm-panel="leads"] .crm-cell[data-crm-id="${rowId}"]`)).toHaveCount(0,{timeout:30_000});
    await page.locator('[data-page-id="crm-sales"] [data-action="dash:tab"][data-panel="prospects"]').click();
    await expect(page.locator('[data-page-id="crm-sales"] [data-crm-panel="prospects"] .crm-cell[data-crm-key="name"]').first()).toHaveValue(companyMarker,{timeout:30_000});
    await page.reload();
    await page.locator('[data-page-id="crm-sales"] [data-action="dash:tab"][data-panel="prospects"]').click();
    await expect(page.locator('[data-page-id="crm-sales"] [data-crm-panel="prospects"] .crm-cell[data-crm-key="name"]').first()).toHaveValue(companyMarker,{timeout:30_000});

    await page.evaluate(()=>{location.hash='#/dashboard'});
    const dashboard=page.locator('[data-prototype-page][data-route="/dashboard"]');
    await expect(dashboard).toBeVisible();
    await expect(dashboard.locator('[data-filter="company"]')).toBeDisabled();
    await expect(dashboard.locator('[data-filter="branch"]')).toBeDisabled();
    const quarter=page.waitForResponse(response=>response.url().includes('/api/v1/dashboard?period=quarter')&&response.ok());
    await dashboard.locator('[data-filter="periode"]').selectOption({label:'Kuartal ini'});
    expect((await (await quarter).json()).data.period).toBe('quarter');

    const workspaceResponse=page.waitForResponse(response=>response.url().includes('/api/v1/workspace')&&response.ok());
    await page.evaluate(()=>{location.hash='#/my-workspace'});
    await workspaceResponse;
    const workspace=page.locator('[data-prototype-page][data-route="/my-workspace"]');
    await expect(workspace).toBeVisible();
    await expect(workspace.locator('.ws-panel[data-panel]')).toHaveCount(9);
    await expect(workspace.getByText('Follow-up PT Nusantara',{exact:true})).toHaveCount(0);

    for(const route of routes){
      await page.evaluate(next=>{location.hash='#'+next},route);
      await expect(page.locator(`[data-prototype-page][data-route="${route}"]`)).toBeVisible({timeout:15_000});
    }

    expect(serverErrors,'No API request may return HTTP 5xx').toEqual([]);
    expect(pageErrors,'No uncaught browser error may occur').toEqual([]);
    await page.locator('[data-prototype-page]:not([hidden]) [data-action="kravio:profile"]').click();
    await page.locator('.profile-menu:not([hidden]) [data-profile="logout"]').click();
    await expect(page).toHaveURL(/#\/login$/,{timeout:30_000});
    await expect(page.locator('[data-page-id="login"] [data-form="login"]')).toBeVisible();
  });
});
