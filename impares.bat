@echo off
for /L %%J in (101,2,199) do (
    for /f "tokens=2 delims=[]" %%B in ('ping -n 1 jiga%%J.local | findstr "["') do (
    )
)
