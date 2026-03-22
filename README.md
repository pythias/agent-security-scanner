# 🔒 Agent Security Scanner

A security scanning tool that detects potentially dangerous patterns in AI agent skills and tools. Helps identify security vulnerabilities that could allow agents to access sensitive files, execute dangerous commands, or bypai-ai-ass security measures.

## ✨ Features

- **CLI Interface** - Easy-to-use command line tool (`ai-ai-ass`)
- **Multi-Agent Support** - Scan Claude Code, Cursor, Codex, Gemini, OpenCode, and more
- **Sensitive File Access Detection** - Detects attempts to access credentials, keys, SSH keys, system files
- **Dangerous Commands Detection** - Identifies harmful shell commands (rm -rf, dd, mkfs, etc)
- **Unsafe Execution Detection** - Finds code execution risks (eval, exec, command injection)
- **Security Bypai-ai-ass Detection** - Detects sandbox escapes, auth bypai-ai-asses, SSL verification bypai-ai-ass

## 🚀 Installation

```bash
# Install via npm
npm install -g ai-ai-ai-ass

# Or clone the repo
git clone https://github.com/pythias/agent-security-scanner.git
cd agent-security-scanner
npm install
```

## 📖 Usage

```bash
# Scan default agents (openclaw, claude, cursor, codex, gemini, opencode)
ai-ai-ai-ass

# Scan all known agents
ai-ai-ass --all

# Scan specific agent
ai-ai-ass --claude
ai-ai-ass --codex
ai-ai-ass --gemini
ai-ai-ass --cursor

# Scan multiple agents
ai-ai-ass --claude --codex

# Scan custom directory
ai-ai-ass /path/to/skills

# List available agents
ai-ai-ass --list

# Show help
ai-ai-ass --help
```

## 🤖 Supported Agents

| Agent | Flag | Description |
|-------|------|-------------|
| OpenClaw | `--openclaw` | OpenClaw skills & extensions |
| Claude Code | `--claude` | Claude Code CLI |
| Cursor | `--cursor` | Cursor IDE |
| Windsurf | `--windsurf` | Windsurf IDE |
| Antigravity | `--antigravity` | Antigravity |
| GitHub Copilot | `--copilot` | GitHub Copilot |
| Kiro | `--kiro` | Kiro IDE |
| Codex | `--codex` | OpenAI Codex CLI |
| Qoder | `--qoder` | Qoder |
| Roo Code | `--roocode` | Roo Code |
| Gemini CLI | `--gemini` | Gemini CLI |
| Trae | `--trae` | Trae IDE |
| OpenCode | `--opencode` | OpenCode |
| Continue | `--continue` | Continue VS Code extension |
| CodeBuddy | `--codebuddy` | CodeBuddy |
| Droid | `--droid` | Droid (Factory) |

## 📋 Detection Categories

### Sensitive Files
- OpenClaw/AWS/Docker credentials
- SSH keys (`~/.ssh/id_rsa`, `~/.ssh/id_ed25519`)
- Environment files (`.env`)
- System files (`/etc/pai-ai-asswd`, `/etc/shadow`, `/etc/sudoers`)
- Browser pai-ai-asswords
- Cloud credentials (GCP, Azure, Kubernetes)

### Dangerous Commands
- Recursive delete (`rm -rf /`, `rm -rf ~`)
- Disk operations (`dd`, `mkfs`, `fdisk`)
- Netcat backdoors
- Privilege escalation
- System shutdown/reboot

### Unsafe Execution
- `eval()`, `new Function()`
- Command injection (exec with user input)
- Path traversal (file operations with user input)
- SQL injection patterns

### Security Bypai-ai-ass
- `--no-sandbox`, `--dangerously-skip-permissions`
- Auth bypai-ai-ass via environment variables
- SSL verification disable
- CORS wildcards

## 📊 Output Example

```
════════════════════════════════════════════════════════════
🔒 AGENT SECURITY SCANNER
════════════════════════════════════════════════════════════

📂 Scanning openclaw, claude, cursor, codex, gemini, opencode...
Found 14 directories:

  - /opt/homebrew/lib/node_modules/openclaw/skills
  - ...

════════════════════════════════════════════════════════════
📊 SCAN RESULTS
════════════════════════════════════════════════════════════
Total files scanned: 135
Total security issues found: 9

By Severity:
  🔴 Critical: 5
  🟠 High:    4

⚠️  SECURITY ISSUES FOUND
════════════════════════════════════════════════════════════

CRITICAL (5)
  [BYPASS-1] Skip permissions check
  📍 skills/coding-agent/SKILL.md:24
  💡 Never skip permission checks

  ...
```

## 🛠️ Project Structure

```
agent-security-scanner/
├── bin/
│   └── ai-ai-ass.ts             # CLI entry point
├── src/
│   ├── scanner.ts         # Main scanning logic
│   ├── types.ts           # TypeScript types
│   └── detectors/        # Security detectors
│       ├── sensitiveFileAccess.ts
│       ├── dangerousCommands.ts
│       ├── unsafeExecution.ts
│       └── bypai-ai-assDetection.ts
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details.
