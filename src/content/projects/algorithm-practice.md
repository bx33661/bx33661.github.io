---
name: 'Api-finder'
description: ''
tags: ['python', 'api', 'finder', 'program']
image: '../../../public/static/finder.png'
link: 'https://github.com/jujubooom/Api-Finder'
startDate: '2025-07-01'
---

# Api-finder

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Readme

一个用于从前端文件中发现API端点的扫描工具。

### 项目结构 (Project Structure)

```
Api-Finder/
├── apifinder/              # 核心源代码包
│   ├── __init__.py        # 包初始化文件
│   ├── apifinder.py       # 主程序逻辑
│   ├── config.py          # 配置模块
│   ├── i18n.py            # 国际化模块
│   ├── ua_manager.py      # 用户代理管理器
│   └── utils.py           # 工具函数
├── config/                 # 配置文件目录
│   └── rules.yaml         # 扫描规则配置
├── docs/                   # 文档目录
│   ├── README.md          # 英文文档
│   └── README_CN.md       # 中文文档
├── tests/                  # 测试目录
│   └── __init__.py
├── main.py                 # 主入口文件
└── requirements.txt        # 项目依赖
```

### 快速开始 (Quick Start)

#### 安装依赖 (Install Dependencies)

```bash
pip install -r requirements.txt

# 可选：如果需要Excel输出格式，请安装
pip install openpyxl
```

#### 基本使用 (Basic Usage)

```bash
# 扫描单个网站
python main.py -u https://example.com

# 使用Cookie进行认证扫描
python main.py -u https://example.com -c "session=abc123"

# 输出结果到文件
python main.py -u https://example.com -o results.txt

# 使用代理
python main.py -u https://example.com -p socks5://127.0.0.1:1080

# 静默模式（只输出发现的API）
python main.py -u https://example.com -s
```

#### 高级选项 (Advanced Options)

```bash
# 详细输出模式
python main.py -u https://example.com -v

# 随机User-Agent
python main.py -u https://example.com -r

# 指定设备类型的User-Agent
python main.py -u https://example.com -a phone    # 手机UA
python main.py -u https://example.com -a weixin   # 微信UA

# 自定义超时和延迟
python main.py -u https://example.com -t 30 -d 1.0

# 强制更新规则文件
python main.py -u https://example.com -U

# 多种输出格式
python main.py -u https://example.com -o results.json    # JSON格式
python main.py -u https://example.com -o results.html    # HTML报告
python main.py -u https://example.com -o results.csv     # CSV表格
python main.py -u https://example.com -o results.xml     # XML格式
python main.py -u https://example.com -o results.xlsx    # Excel表格
python main.py -u https://example.com -o results.md      # Markdown格式
```

### 项目重构说明 (Refactoring Notes)

这个版本对项目结构进行了重新组织：

- **代码模块化**: 所有Python源代码移动到`apifinder/`包中
- **配置分离**: 配置文件独立存放在`config/`目录
- **文档集中**: 所有文档文件放在`docs/`目录
- **向后兼容**: 通过`main.py`保持原有的使用方式

### 功能特性 (Features)

- 🔍 自动发现网站中的API端点
- 🌐 支持多种代理模式（HTTP/SOCKS5）
- 📱 多种User-Agent支持（桌面/移动/微信）
- 📊 丰富的输出格式（TXT/JSON/CSV/HTML/XML/Excel/Markdown）
- 🎨 美观的命令行界面
- 🔄 自动规则更新机制
- 🌍 英文界面支持

### 许可证 (License)

本项目采用开源许可证，详见项目仓库。

### 贡献 (Contributing)

欢迎提交Issue和Pull Request来改进这个项目。

---
