@echo off
echo ===============================
echo 📁 Deploy su GitHub e GitHub Pages
echo ===============================

cd /d %~dp0

echo ▶ Aggiunta file...
git add .

echo ▶ Commit...
git commit -m "Aggiornamento e deploy automatico"

echo ▶ Push su GitHub...
git push origin main

echo ▶ Deploy su GitHub Pages...
npm run deploy

echo ✅ Fatto! Controlla:
echo https://simonegiannecchini.github.io/Progetto-Javascript-Advanced/

pause
