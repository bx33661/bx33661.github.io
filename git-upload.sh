#!/bin/bash

# 一键Git上传脚本
# 作者: bx
# 功能: 自动添加、提交和推送代码到远程仓库

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认参数
COMMIT_MESSAGE=""
BRANCH="main"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--message)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [-m 提交信息] [-b 分支名]"
            echo "选项:"
            echo "  -m, --message    指定提交信息"
            echo "  -b, --branch     指定分支名 (默认: main)"
            echo "  -h, --help       显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🚀 开始一键Git上传...${NC}"

# 检查git状态
echo -e "${YELLOW}📊 检查Git状态...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ 工作目录是干净的，没有需要提交的更改${NC}"
    exit 0
fi

# 显示当前更改
echo -e "${YELLOW}📝 当前更改:${NC}"
git status --short

# 获取提交信息
if [ -z "$COMMIT_MESSAGE" ]; then
    echo -n "请输入提交信息: "
    read COMMIT_MESSAGE
    if [ -z "$COMMIT_MESSAGE" ]; then
        COMMIT_MESSAGE="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
fi

echo -e "${YELLOW}💾 添加所有文件到暂存区...${NC}"
git add .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 添加文件失败${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 提交更改...${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 提交失败${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 推送到远程仓库...${NC}"
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 上传成功！${NC}"
    echo -e "${CYAN}📋 提交信息: $COMMIT_MESSAGE${NC}"
    echo -e "${CYAN}🌿 分支: $BRANCH${NC}"
else
    echo -e "${RED}❌ 推送失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 完成！${NC}" 