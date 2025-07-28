#!/usr/bin/env pwsh

# 一键Git上传脚本
# 作者: bx
# 功能: 自动添加、提交和推送代码到远程仓库

param(
    [string]$CommitMessage = "",
    [string]$Branch = "main"
)

Write-Host "🚀 开始一键Git上传..." -ForegroundColor Green

# 检查git状态
Write-Host "📊 检查Git状态..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status -eq "") {
    Write-Host "✅ 工作目录是干净的，没有需要提交的更改" -ForegroundColor Green
    exit 0
}

# 显示当前更改
Write-Host "📝 当前更改:" -ForegroundColor Yellow
git status --short

# 获取提交信息
if ($CommitMessage -eq "") {
    $CommitMessage = Read-Host "请输入提交信息"
    if ($CommitMessage -eq "") {
        $CommitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
}

Write-Host "💾 添加所有文件到暂存区..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 添加文件失败" -ForegroundColor Red
    exit 1
}

Write-Host "📝 提交更改..." -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 提交失败" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 推送到远程仓库..." -ForegroundColor Yellow
git push origin $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 上传成功！" -ForegroundColor Green
    Write-Host "📋 提交信息: $CommitMessage" -ForegroundColor Cyan
    Write-Host "🌿 分支: $Branch" -ForegroundColor Cyan
} else {
    Write-Host "❌ 推送失败" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 完成！" -ForegroundColor Green 