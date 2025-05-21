@echo off
setlocal enabledelayedexpansion

set OUTPUT=ips_ativos.txt
echo. > %OUTPUT%

echo Iniciando varredura de ping...

for /L %%x in (0,1,3) do (
    for /L %%y in (100,1,254) do (
        set "ip=192.168.%%x.%%y"
        echo Testando !ip!...

        ping -n 2 -w 500 !ip! > nul
        if !errorlevel! == 0 (
            echo ✅ !ip! respondeu
            echo !ip! >> %OUTPUT%
        ) else (
            echo ❌ !ip! sem resposta
        )
    )
)

echo.
echo Varredura finalizada.
echo IPs ativos foram salvos em: %OUTPUT%
pause
