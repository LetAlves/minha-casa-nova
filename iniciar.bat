@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\alves\OneDrive\Documentos\minha-casa-nova"

echo [1/4] Removendo modulos antigos...
rmdir /s /q node_modules 2>nul

echo [2/4] Instalando Expo e dependencias...
call "C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps

echo [3/4] Instalando React e React Native nas versoes certas para SDK 54...
call "C:\Program Files\nodejs\npx.cmd" expo install react react-native

echo [4/4] Iniciando o app...
echo.
call "C:\Program Files\nodejs\npx.cmd" expo start
pause
