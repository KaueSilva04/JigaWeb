@echo off
for /L %%I in (100,2,200) do (
    for /f "tokens=2 delims=[]" %%A in ('ping -n 1 jiga%%I.local | findstr "["') do (
    )
)
