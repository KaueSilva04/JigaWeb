@echo off
setlocal enabledelayedexpansion

:: Limpa arquivos antigos
del sucesso1.log >nul 2>&1 & del sucesso2.log >nul 2>&1 & del todos_os_sucessos.log >nul 2>&1

:: Thread 1 (pares)
start "" /B cmd /c "for /L %%I in (100,2,200) do for /f "tokens=3 delims= " %%A in ('ping -n 1 jiga%%I.local ^| find "Resposta de"') do echo jiga%%I.local - %%A>>sucesso1.log"

:: Thread 2 (ímpares)
start "" /B cmd /c "for /L %%J in (101,2,199) do for /f "tokens=3 delims= " %%B in ('ping -n 1 jiga%%J.local ^| find "Resposta de"') do echo jiga%%J.local - %%B>>sucesso2.log"

:: Aguarda os pings terminarem
:wait
timeout /t 1 >nul
tasklist | find /i "cmd.exe" | findstr /i /c:"cmd /c" >nul
if %errorlevel% equ 0 goto wait

:: Junta resultados
type sucesso1.log sucesso2.log > todos_os_sucessos.log

:: Mostra resultados
echo. & echo === Hosts que responderam com IP ===
type todos_os_sucessos.log
pause
exit /b
