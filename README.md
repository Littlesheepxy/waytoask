# ShareDS
这是一个Chrome浏览器扩展，用于分享DeepSeek对话内容。用户可以轻松地将他们的DeepSeek对话分享给其他人。

## 功能特点

- 一键分享DeepSeek对话
- 自动提取对话内容和元数据
- 生成可分享的永久链接
- 支持深色模式
- 简洁的用户界面

## 安装说明

1. 下载或克隆此仓库到本地
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的目录

## 使用方法

1. 访问DeepSeek网站并进行对话
2. 在对话界面对话栏找到"分享"按钮
3. 点击分享按钮，等待生成分享链接
4. 分享链接将在新标签页中打开，可以复制链接分享给他人

## 项目结构

```
deepseek-share/
├── manifest.json        # Chrome扩展配置文件
├── content.js          # 主要的内容脚本
├── styles.css          # 样式文件
├── icons/              # 图标文件夹
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # 项目说明文档
```

## 开发说明

### 环境要求
- Chrome浏览器
- 后端API服务（需要单独部署）


### 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/Littlesheepxy/shareDS.git
```

2. 在Chrome扩展管理页面加载解压的扩展

3. 修改代码后，点击扩展管理页面的"刷新"按钮即可看到更新

## 注意事项

- 确保DeepSeek网站的API访问权限
- 需要配置正确的后端API地址
- 部分功能可能需要根据DeepSeek网站的更新进行调整

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件 
