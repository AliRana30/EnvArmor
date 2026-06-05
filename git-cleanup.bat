@echo off
echo Cleaning up tracked config/report files from Git history...
git rm --cached .envarmor envarmor-report.json report.json
git commit -m "chore: remove tracked config and report files from git history"
git push
echo Cleanup complete!
pause
