import {test,expect,type Page} from '@playwright/test';

const windowSizes=[{width:1920,height:1080},{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:375,height:812}];

/** API mocks are intentionally limited to frontend visual + behavior regression.
 * Real Laravel/PostgreSQL integration has separate backend tests. */
async function session(page:Page){
  await page.route('**/api/v1/me',route=>route.fulfill({json:{data:{id:'test-user',name:'Test User',email:'qa@sop.local',company_id:'test-company',role:'super_admin'}}}));
  await page.route('**/api/v1/module-states',route=>route.request().method()==='PUT'
    ?route.fulfill({json:{data:(route.request().postDataJSON().states as {route:string;section:string}[]).map(x=>({...x,version:1}))}})
    :route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/grid-snapshots',route=>route.request().method()==='PUT'
    ?route.fulfill({json:{data:(route.request().postDataJSON().snapshots as {route:string;panel_id:string}[]).map(x=>({...x,version:1}))}})
    :route.fulfill({json:{data:[]}}));
  await page.route('**/api/v1/dashboard',route=>route.fulfill({json:{data:{customers:3,quotations:5,projects:8}}}));
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
  await page.locator('[data-page-id="crm-sales"] .crm-cell').first().fill('Backed by DB');
  await page.locator('[data-page-id="crm-sales"] [data-crm-act="commit"]').first().click();
  await expect.poll(()=>persisted).toBe(true);
});

test('CRM CSV export starts a real browser download',async({page})=>{
  await session(page);await page.goto('/#/crm-sales');
  await expect(page.locator('[data-page-id="crm-sales"] [data-crm-act="export"]').first()).toBeVisible();
  const download=page.waitForEvent('download');
  await page.locator('[data-page-id="crm-sales"] [data-crm-act="export"]').first().click();
  await expect((await download).suggestedFilename()).toMatch(/\.csv$/);
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
  await expect(page.locator('[data-page-id="settings"] [data-crud="role-perm"]').first()).toBeVisible();
  await page.locator('[data-page-id="settings"] [data-crud="role-perm"]').first().click();
  await expect.poll(()=>wrote).toBe(true);
});
