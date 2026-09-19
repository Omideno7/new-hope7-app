"""Retain every rendering/playback assertion and bound any stalled test process."""
import faulthandler,runpy
faulthandler.enable();faulthandler.dump_traceback_later(60,repeat=True)
try:
    runpy.run_path('scripts/study-v454/audio_fixture.py',run_name='__main__')
    runpy.run_path('scripts/study-v454/browser.py',run_name='__main__')
finally:faulthandler.cancel_dump_traceback_later()
