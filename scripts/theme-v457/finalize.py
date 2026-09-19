"""Final color-readability refinements; deterministic and limited to new appearance files."""
from pathlib import Path
p=Path('js/nh7-theme-studio-v453.js');s=p.read_text();s=s.replace('"muted":"#604477"','"muted":"#593b70"');p.write_text(s)
p=Path('css/nh7-theme-gallery-v457.css');s=p.read_text().replace('font:650 .8rem/1.5 inherit;','font-family:inherit;font-weight:650;font-size:.8rem;line-height:1.5;');p.write_text(s)
print('New Orchid palette secondary text strengthened; existing eight themes unchanged.')
