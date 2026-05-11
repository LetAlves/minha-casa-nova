@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\alves\OneDrive\Documentos\minha-casa-nova"
echo Iniciando Expo (limpando cache)...
call "C:\Program Files\nodejs\npx.cmd" expo start --clear
pause
