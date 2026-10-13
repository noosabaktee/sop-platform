"""Offline guard: HTML/CSS parity and route state registration coverage."""
from pathlib import Path
import re,sys
root=Path(__file__).resolve().parents[1]
html=(root/'references/prototype.original.html').read_text()
css=(root/'frontend/src/styles/prototype.css').read_text()
body=(root/'frontend/public/original-body.html').read_text()
js=(root/'frontend/public/prototype-original.js').read_text()
expected_routes=set(re.findall(r'data-prototype-page[^>]*data-route="([^"]+)"',body))
module_routes=set(re.findall(r'window\.SOPModules\?\.register\(\'([^\']+)\'',js))
grid_routes=set(re.findall(r'window\.SOPBridge\?\.attach\(\'([^\']+)\'',js))
checks={
 'CSS prototype unchanged': css in html,
 '28 prototype routes available':len(expected_routes)==28,
 '13 modules with SQL state bridge':len(module_routes)==13,
 '11 pages with SQL grid bridge':len(grid_routes)==11,
 'all SQL-bound modules included in original routes':(module_routes|grid_routes)<=expected_routes,
 'no Docker Compose files':not list(root.glob('**/docker-compose*.yml')),
}
for name,passed in checks.items():print(('PASS' if passed else 'FAIL'),name)
print('Total routes:',len(expected_routes),'Grid:',len(grid_routes),'Module state:',len(module_routes),'Authentication: /login')
print('Unintegrated UI-only routes:',sorted(expected_routes-(module_routes|grid_routes|{'/login'})))
if not all(checks.values()):sys.exit(1)
