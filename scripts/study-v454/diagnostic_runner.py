"""Diagnostics only; retain every test assertion and preserve evidence on stalls."""
import faulthandler,runpy,sys
faulthandler.enable()
faulthandler.dump_traceback_later(60,repeat=True)
try:runpy.run_path('scripts/study-v454/browser.py',run_name='__main__')
finally:faulthandler.cancel_dump_traceback_later()
