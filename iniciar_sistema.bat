@echo off
cd /d %~dp0
title Sampaio Cell - Sistema de Gestao

:: Inicia o backend minimizado ou em segundo plano
start /min cmd /c "cd /d %~dp0backend && npm run dev"

:: Aguarda 3 segundos para o servidor subir
timeout /t 3 /nobreak > nul

:: Abre o navegador automaticamente na aplicação
start http://localhost:5173X