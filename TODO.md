# ai-ass TODO

## 📋 项目信息
- **版本**: 1.0.0
- **包名**: ai-ass
- **仓库**: https://github.com/pythias/agent-security-scanner

---

## 🐛 Bug Fixes

### 紧迫
- [ ] 重复检测相同问题 (BYPASS-1 出现两次)
- [ ] 某些 agent 目录不存在时报错而非跳过

### 常规
- [ ] 扫描进度条在 Windows 上显示异常
- [ ] 长路径在终端换行问题
- [ ] 某些正则匹配到注释中的代码产生误报

---

## 🎨 Output Enhancement

### 优先级 P0
- [ ] **彩色终端输出** - 使用 `picocolors` 实现彩色输出
  - 红色: Critical
  - 橙色: High
  - 黄色: Medium
  - 蓝色: Low / Info
- [ ] **表格布局** - 使用 `cli-table3` 展示结果
- [ ] **进度条** - 显示扫描进度，使用 `ora` 或 `progress`

### 优先级 P1
- [ ] **JSON 输出** (`--format json`) - 结构化输出供程序解析
- [ ] **SARIF 输出** (`--format sarif`) - 安全工具通用格式
- [ ] **Markdown 输出** (`--format md`) - 生成 Markdown 报告
- [ ] **HTML 报告** (`--format html`) - 美观的网页报告

### 优先级 P2
- [ ] **交互式 TUI** - 使用 `ink` 或 `blessed` 交互界面
- [ ] **导出 PDF** - 生成可打印的报告

---

## 🔍 Detection Capabilities

### 优先级 P0
- [ ] **更多敏感文件类型**
  - AWS credentials (`~/.aws/credentials`)
  - GCP credentials (`~/.config/gcloud`)
  - Kubernetes config (`~/.kube/config`)
  - SSH known_hosts
  - Docker config

### 优先级 P1
- [ ] **恶意代码检测**
  - 挖矿程序 (xmrig, minerd, etc.)
  - 反向 shell 检测
  - rookit 检测
- [ ] **隐私数据检测 (PII)**
  - 身份证号
  - 手机号
  - 邮箱地址
  - 信用卡号
- [ ] **依赖漏洞检测**
  - 集成 `npm audit`
  - 检查 package.json 中的已知漏洞版本

### 优先级 P2
- [ ] **上下文感知检测**
  - 区分示例代码和实际代码
  - 过滤注释中的误报
- [ ] **严重性智能评估**
  - 基于利用链评估真实风险
  - 标记被注释掉的危险代码

---

## ⚙️ Configuration & UX

### 优先级 P0
- [ ] **配置文件** (`~/.ai-ass.yaml`)
  ```yaml
  exclude:
    - "**/node_modules/**"
    - "**/test/**"
  detectors:
    enabled: all
    custom:
      - id: CUSTOM-001
        pattern: "dangerous pattern"
  agents:
    openclaw:
      paths:
        - /custom/path
  ```
- [ ] **白名单机制** - 忽略已知安全的代码路径

### 优先级 P1
- [ ] **自定义规则** - 用户添加自己的检测模式
- [ ] **CI/CD 配置模板**
  - GitHub Actions workflow
  - GitLab CI template
  - Pre-commit hook

### 优先级 P2
- [ ] **交互式配置向导** - `ai-ass init`
- [ ] **增量扫描** - 只扫描变更的文件
- [ ] **缓存机制** - 缓存扫描结果提高速度

---

## 🧪 Testing

### 优先级 P0
- [ ] **单元测试**
  - 每个 detector 的测试
  - 工具函数测试
- [ ] **集成测试**
  - 扫描真实 skills 目录
  - 验证输出格式

### 优先级 P1
- [ ] **基准测试** - 测试大目录扫描性能
- [ ] **模糊测试** - 测试边界条件

### 优先级 P2
- [ ] **CI 自动测试** - GitHub Actions
- [ ] **测试覆盖率** - 达到 80%+

---

## 📚 Documentation

### 优先级 P0
- [ ] **完善 README**
  - 安装说明
  - 使用示例
  - 输出格式说明
- [ ] **CLI 完整帮助** - `ai-ass --help` 完整

### 优先级 P1
- [ ] **贡献指南** (CONTRIBUTING.md)
- [ ] **检测规则文档** - 说明每个检测器的检测范围
- [ ] **常见问题** (FAQ.md)

### 优先级 P2
- [ ] **视频教程**
- [ ] **官网页面**

---

## 🔧 Code Quality

### 优先级 P0
- [ ] **TypeScript strict mode** - 开启 `strict: true`
- [ ] **ESLint 配置** - 代码风格统一
- [ ] **Prettier 配置** - 格式化代码

### 优先级 P1
- [ ] **代码重构**
  - 抽取公共函数
  - 减少重复代码
  - 改善命名
- [ ] **JSDoc 注释** - 公共函数添加文档

### 优先级 P2
- [ ] **性能优化**
  - 多线程/多进程扫描
  - WebAssembly 加速
- [ ] **内存优化** - 大文件处理

---

## 🚀 Release & Distribution

### 优先级 P0
- [ ] **GitHub Release** - 打版本 tag
- [ ] **自动发布** - GitHub Actions 自动发布 npm

### 优先级 P1
- [ ] **多平台二进制** - 使用 `pkg` 或 `vercel/ncc` 打包
  - Linux
  - macOS
  - Windows
- [ ] **Homebrew 安装** - `brew install ai-ass`

### 优先级 P2
- [ ] **VS Code 插件**
- [ ] **JetBrains 插件**

---

## 📈 未来功能 (Nice to Have)

- [ ] **Dashboard** - Web 界面展示扫描历史
- [ ] **趋势分析** - 历史数据对比
- [ ] **实时监控** - 监控新安装的 skills
- [ ] **API Server** - 提供 REST API
- [ ] **Slack/Discord 集成** - 扫描结果通知

---

## 🎯 优先级总结

### 当前版本 (1.0.x) 应该完成
1. 彩色输出 + 表格
2. JSON 输出
3. 配置文件
4. 单元测试
5. 代码质量 (ESLint + Prettier)

### 下个版本 (1.1.x) 应该完成
1. SARIF/HTML 输出
2. 更多检测器
3. CI/CD 集成
4. 文档完善

### 未来版本 (2.0.x)
1. TUI 交互界面
2. 增量扫描
3. Dashboard
4. VS Code 插件

---

## 开始开发顺序建议

```
1. 彩色输出 + 表格  (1-2天)
   ↓
2. JSON 输出       (1天)
   ↓
3. 配置文件       (1天)
   ↓
4. ESLint + Prettier + 单元测试  (1-2天)
   ↓
5. 更多检测器     (2-3天)
   ↓
6. 打包发布       (1天)
```

---

生成日期: 2026-03-22
最后更新: -
