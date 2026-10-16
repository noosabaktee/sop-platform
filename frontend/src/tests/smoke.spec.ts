import {test,expect,type Page} from '@playwright/test';

const windowSizes=[{width:1920,height:1080},{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:375,height:812}];

/** API mocks are intentionally limited to frontend visual + behavior regression.
 * Real Laravel/PostgreSQL integration has separate backend tests. */
async function session(page:Page){
  await page.route('**/api/v1/me',route=>route.fulfill({json:{data:{id:'test-user',name:'Test User',email:'qa@sop.local',company_id:'test-company',role:'super_admin'}}}));
  await page.route('**/api/v1/admin/users',route=>route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/module-states',route=>route.request().method()==='PUT'
    ?route.fulfill({json:{data:(route.request().postDataJSON().states as {route:string;section:string}[]).map(x=>({...x,version:1}))}})
    :route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/grid-snapshots',route=>route.request().method()==='PUT'
    ?route.fulfill({json:{data:(route.request().postDataJSON().snapshots as {route:string;panel_id:string}[]).map(x=>({...x,version:2}))}})
    :route.fulfill({json:{data:[{route:'/crm-sales',panel_id:'leads',version:1,rows:[{
      __id:'leads-test-1',name:'Test Lead',company:'PT Test',email:'lead@example.test',source:'Web',score:80,owner:'Test User',status:'New'
    }]}]}}));
  await page.route('**/api/v1/dashboard',route=>route.fulfill({json:{data:{customers:3,quotations:5,projects:8}}}));
  // Keep mocked UI tests independent from a Laravel server that may happen to
  // be running locally. Exact handlers above remain authoritative.
  await page.route('**/api/v1/**',route=>{
    const path=new URL(route.request().url()).pathname;
    if(['/api/v1/me','/api/v1/admin/users','/api/v1/module-states','/api/v1/grid-snapshots','/api/v1/dashboard'].includes(path)){
      return route.fallback();
    }
    return route.fulfill({json:{data:{}}});
  });
}
async function bridgeReady(page:Page,kind:'grid'|'module'){
  await expect.poll(()=>page.evaluate(type=>{
    const w=window as unknown as {
      SOPBridge?:{mountedCount:number;isReady:boolean};
      SOPModules?:{size:number;isReady:boolean};
    };
    return type==='grid'
      ?Boolean(w.SOPBridge?.mountedCount&&w.SOPBridge.isReady)
      :Boolean(w.SOPModules?.size&&w.SOPModules.isReady);
  },kind),{timeout:20_000}).toBe(true);
}

for(const size of windowSizes){
  test(`frozen UI: login visible at ${size.width}x${size.height}`,async({page})=>{
    await page.setViewportSize(size);
    await page.route('**/api/v1/me',route=>route.fulfill({status:401,contentType:'application/json',body:'{"message":"Unauthenticated"}'}));
    await page.goto('/#/login');
    await expect(page.locator('[data-page-id="login"] [data-form="login"]')).toBeVisible();
    await expect(page.locator('[data-page-id="login"] #email')).toBeVisible();
    await expect(page.locator('[data-page-id="login"] #password')).toBeVisible();
  });
}

test('CRM retains inline editing, native toolbar and no generic editor modal',async({page})=>{
  await session(page);
  await page.goto('/#/crm-sales');
  await bridgeReady(page,'grid');
  await expect(page.locator('[data-page-id="crm-sales"] .crm-cell').first()).toBeVisible();
  await expect(page.locator('[data-page-id="crm-sales"] [data-crm-act="export"]').first()).toBeVisible();
  await expect(page.locator('[data-page-id="crm-sales"] [data-crm-act="import"]').first()).toBeVisible();
  const cell=page.locator('[data-page-id="crm-sales"] .crm-cell').first();
  await cell.fill('Inline Edit Test');
  await expect(cell).toHaveValue('Inline Edit Test');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('CRM commit is persisted through PostgreSQL API',async({page})=>{
  await session(page);
  let persisted=false;
  page.on('request',request=>{if(request.url().includes('/api/v1/grid-snapshots')&&request.method()==='PUT'&&request.postDataJSON()?.seed_only!==true)persisted=true});
  await page.goto('/#/crm-sales');
  await bridgeReady(page,'grid');
  await page.locator('[data-page-id="crm-sales"] .crm-cell').first().fill('Backed by DB');
  await page.locator('[data-page-id="crm-sales"] [data-crm-act="commit"]').first().click();
  await expect.poll(()=>persisted).toBe(true);
});

test('CRM export starts a real browser download',async({page})=>{
  await session(page);await page.goto('/#/crm-sales');
  await bridgeReady(page,'grid');
  await expect(page.locator('[data-page-id="crm-sales"] [data-crm-act="export"]').first()).toBeVisible();
  const download=page.waitForEvent('download');
  await page.locator('[data-page-id="crm-sales"] [data-crm-act="export"]').first().click();
  await expect((await download).suggestedFilename()).toMatch(/\.(xlsx|csv)$/);
});


test('Settings native permission edit persists to module-states without changing its visual grid',async({page})=>{
  await session(page);
  let wrote=false;
  page.on('request',request=>{
    if(request.url().includes('/api/v1/module-states')&&request.method()==='PUT'){
      const body=request.postDataJSON();
      if(!body.seed_only&&body.states?.some((x:{route:string})=>x.route==='/settings'))wrote=true;
    }
  });
  await page.goto('/#/settings');
  await bridgeReady(page,'module');
  await page.locator('[data-page-id="settings"] #set-tabs [data-tab="roles"]').click();
  await expect(page.locator('[data-page-id="settings"] [data-crud="role-perm"]').first()).toBeVisible();
  await page.locator('[data-page-id="settings"] [data-crud="role-perm"]').first().click();
  await expect.poll(()=>wrote).toBe(true);
});

test('My Workspace renders informative context banner and hides misleading action buttons',async({page})=>{
  await session(page);
  await page.route('**/api/v1/workspace',route=>route.fulfill({
    json:{
      data:{
        tasks:[{id:'task-1',title:'Follow up penawaran',status:'pending',project:'PRJ-01',due_at:'2026-10-25'}],
        projects:[{id:'prj-1',code:'PRJ-01',name:'Pabrik Baru',customer:'PT Maju',status:'in_progress',progress:45}],
        approvals:[],
        activities:[],
        calendar:[],
        documents:[],
        notifications:[],
        emails:[],
        profile:[],
        summary:{open_tasks:1,pending_approvals:0,unread_notifications:0}
      }
    }
  }));
  await page.goto('/#/my-workspace');
  const banner=page.locator('#ws-panel-my-workspace .sop-context-banner');
  await expect(banner).toBeVisible({timeout:15_000});
  await expect(banner).toContainText('Rangkuman Tugas & Tindak Lanjut Personal');
  await expect(banner).toContainText('Alur resmi:');

  // Verify misleading create button in Dashboard projects panel is hidden
  const fakeCreateProject=page.locator('.ws-panel[data-panel="dashboard"] [data-action="sop:create"]');
  await expect(fakeCreateProject).toBeHidden();
  const fakeCreateApproval=page.locator('.ws-panel[data-panel="crm-sales"] [data-action="sop:create"]');
  await expect(fakeCreateApproval).toBeHidden();
});

test('Authoritative domain projection renders informative context banner and hides misleading CRUD buttons',async({page})=>{
  await session(page);
  await page.goto('/#/finance');
  await bridgeReady(page,'grid');
  await page.locator('#ws-tab-accounting').click();
  const panel=page.locator('[data-bd-panel="accounting"]');
  await expect(panel).toBeVisible({timeout:15_000});
  const banner=panel.locator('.sop-context-banner');
  await expect(banner).toBeVisible({timeout:15_000});
  await expect(banner).toContainText('Entri Jurnal Umum & Buku Besar Terverifikasi');

  // Misleading bulk delete and commit buttons on locked accounting grid are hidden
  await expect(panel.locator('[data-bd-act="delete"]')).toBeHidden();
  await expect(panel.locator('[data-bd-act="commit"]')).toBeHidden();
});

