@echo off
chcp 65001 >nul
title 一键Git上传脚本

echo 🚀 开始一键Git上传...
echo.

REM 检查git状态
echo 📊 检查Git状态...
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git仓库未初始化或不在Git目录中
    pause
    exit /b 1
)

REM 检查是否有更改
git status --porcelain | findstr /r "^" >nul
if %errorlevel% neq 0 (
    echo ✅ 工作目录是干净的，没有需要提交的更改
    pause
    exit /b 0
)

REM 显示当前更改
echo 📝 当前更改:
git status --short
echo.

REM 获取提交信息
set /p commit_message="请输入提交信息 (直接回车使用默认时间戳): "
if "%commit_message%"=="" (
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "commit_message=Update: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"
)

echo 💾 添加所有文件到暂存区...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)

echo 📝 提交更改...
git commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo ❌ 提交失败
    pause
    exit /b 1
)

echo 🔄 推送到远程仓库...
git push origin main
if %errorlevel% equ 0 (
    echo ✅ 上传成功！
    echo 📋 提交信息: %commit_message%
    echo 🌿 分支: main
) else (
    echo ❌ 推送失败
    pause
    exit /b 1
)

echo 🎉 完成！
pause 