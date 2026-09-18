"""Repeatable candidate refinements; no external calls or database changes."""
from pathlib import Path

def edit(name,fn):
    p=Path(name);before=p.read_text();after=fn(before)
    if before!=after:p.write_text(after)

def module(s):
    if 'function displayText(v)' not in s:
        helper=r"""  function displayText(v) {
    const text=String(v.text?.[state.lang]||v.text?.en||'');
    return state.lang==='en'?text.replace(new RegExp('^\\s*'+Number(v.verse)+'\\.\\s+'),''):text;
  }
"""
        assert '  function back(params)' in s
        s=s.replace('  function back(params)',helper+'  function back(params)',1)
    s=s.replace('return {bibleKeywords,search};','return {bibleKeywords,search,displayText};')
    s=s.replace("String(v.text?.[lang]||'').slice(0,220)","displayText(v).slice(0,220)")
    return s
edit('js/nh7-bible-keywords-v451.js',module)

def apply(s):
    patch='  s=s.replaceAll("v.text?.[state.lang]||v.text?.en||\'\'","nh7BibleKeywordsV451.displayText(v)");\n'
    if patch not in s:
        assert '  return s;\n});' in s
        s=s.replace('  return s;\n});',patch+'  return s;\n});',1)
    compact='.nh7-preview-notice{font-size:.78rem;line-height:1.5}.nh7-preview-notice>div[dir="ltr"]{display:none}.nh7-preview-notice button{border:1px solid #9ab6cc;border-radius:8px;background:#fff;color:#17344b}'
    if compact not in s:s=s.replace('</style>',compact+'</style>')
    font_guard=r"""// Keep Preview offline from external font services without changing production styles.
for(const match of [...preview.matchAll(/<link\b[^>]*href="(css\/[^"?]+)(?:\?[^\"]*)?"[^>]*>/g)]){
  const path=match[1],css=fs.readFileSync(path,'utf8');
  if(!/^@import[^\n]*https?:/m.test(css))continue;
  const safePath=path.replace('css/','css/nh7-bible-preview-');
  fs.writeFileSync(safePath,css.replace(/^@import[^\n]*https?:[^\n]*\n?/gm,''));
  preview=preview.replace(match[0],match[0].replace(/href="[^\"]*"/,'href="'+safePath+'?v=4.5.1"'));
}
"""
    if 'without changing production styles' not in s:
        assert "fs.writeFileSync('bible-preview.html',preview);" in s
        s=s.replace("fs.writeFileSync('bible-preview.html',preview);",font_guard+"fs.writeFileSync('bible-preview.html',preview);")
    return s
edit('scripts/bible-preview/apply.mjs',apply)

def test(s):
    s=s.replace('page.wait_for_function(', 'wait_js(page,')
    if 'def wait_js(' not in s:
        helper='''def wait_js(p,expression):
    for _ in range(250):
        if p.evaluate(expression):return
        p.wait_for_timeout(40)
    raise AssertionError('Timed out: '+expression)
'''
        s=s.replace('SEED=',helper+'SEED=',1)
    marker="        passed('Empty search, Enter submission, and result opens exact chapter/verse')"
    check="        assert page.locator('#v-16 .verse-text').inner_text().startswith('For God so loved')\n"
    if check not in s:
        assert marker in s;s=s.replace(marker,check+marker,1)
    return s
edit('scripts/bible-preview/browser.py',test)
print('Candidate refinements applied; CSP stays strict and source verse text stays unchanged.')
