#!/usr/bin/env python3
"""Preserve validation exit codes; expose failures when runner logs are unavailable."""
import subprocess,sys
if len(sys.argv)<2:raise SystemExit('Usage: run-ci-check.py COMMAND [ARG...]')
command=sys.argv[1:]
print('CHECK: '+' '.join(command),flush=True)
result=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
print(result.stdout,end='',flush=True)
if result.returncode:
 def escape(value):return value.replace('%','%25').replace('\r','%0D').replace('\n','%0A')
 title=escape(' '.join(command[:2])).replace(',','%2C').replace(':','%3A')
 print(f'::error title={title}::{escape(result.stdout[-6000:])}',flush=True)
raise SystemExit(result.returncode)
