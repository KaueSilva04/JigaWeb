@echo off
setlocal enabledelayedexpansion

REM Arquivo onde os IPs válidos serão salvos
set OUTPUT=ips_com_resposta.txt
echo. > %OUTPUT%  REM limpa o arquivo

for /L %%x in (0,1,3) do (
    for /L %%y in (100,1,254) do (
        set ip=192.168.%%x.%%y
        echo Verificando !ip!...

        curl --silent --max-time 2 --output temp.txt --write-out "%%{http_code}" http://!ip!/getconfig > status.txt

        set /p status=<status.txt

        if "!status!" == "200" (
            echo ✅ !ip! respondeu!
            echo !ip! >> %OUTPUT%
        ) else (
            echo ❌ !ip! não respondeu corretamente (Status !status!)
        )

        del status.txt >nul 2>&1
        del temp.txt >nul 2>&1
        echo.
    )
)

echo -------------------------------
echo Fim das requisições.
echo IPs válidos salvos em: %OUTPUT%
pause
