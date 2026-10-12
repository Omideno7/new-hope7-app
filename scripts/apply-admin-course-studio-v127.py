#!/usr/bin/env python3
from pathlib import Path

p=Path('admin-v239-stable.html')
text=p.read_text()
asset='<script src="js/nh7-admin-course-studio-v127.js?v=1.27.0"><\\/script>'
anchor='<script src="js/nh7-admin-student-academic-v540.js?v=${BUILD}&reports=116"><\\/script>'

# Normalize retries to exactly one Course Studio loader.
text=text.replace(asset,'')
if text.count(anchor)!=1:
    raise SystemExit(f'Admin Course Studio loader: expected one academic anchor, found {text.count(anchor)}')
text=text.replace(anchor,anchor+asset,1)
# Keep file whitespace clean.
text='\n'.join(line.rstrip() for line in text.splitlines())+'\n'
p.write_text(text)
print('Admin Course Studio v127 loader integrated exactly once')
