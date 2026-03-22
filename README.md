# 🔒 Agent Security Scanner

A security scanning tool that detects potentially dangerous patterns in AI agent skills and tools. Helps identify security vulnerabilities that could allow agents to access sensitive files, execute dangerous commands, or bypass security measures.

## ✨ Features

- **CLI Interface** - Easy-to-use command line tool (`ass`)
- **Multi-Agent Support** - Scan Claude Code, Cursor, Codex, Gemini, OpenCode, and more
- **Sensitive File Access Detection** - Detects attempts to access credentials, keys, SSH keys, system files
- **Dangerous Commands Detection** - Identifies harmful shell commands (rm -rf, dd, mkfs, etc)
- **Unsafe Execution Detection** - Finds code execution risks (eval, exec, command injection)
- **Security Bypass Detection** - Detects sandbox escapes, auth bypasses, SSL verification bypass

## 🚀 Installation

```bash
# Clone the repo
git clone https://github.com/pythias/agent-security-scanner.git
cd agent-security-scanner

# Install globally (optional)
npm link

# Or run directly
npm install
```

## 📖 Usage

```bash
# Scan default agents (openclaw, claude, cursor, codex, gemini, opencode)
ass

# Scan all known agents
ass --all

# Scan specific agent
ass --claude
ass --codex
ass --gemini
ass --cursor

# Scan multiple agents
ass --claude --codex

# Scan custom directory
ass /path/to/skills

# List available agents
ass --list

# Show help
ass --help
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
- System files (`/etc/passwd`, `/etc/shadow`, `/etc/sudoers`)
- Browser passwords
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

### Security Bypass
- `--no-sandbox`, `--dangerously-skip-permissions`
- Auth bypass via environment variables
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
│   └── ass.ts             # CLI entry point
├── src/
│   ├── scanner.ts         # Main scanning logic
│   ├── types.ts           # TypeScript types
│   └── detectors/        # Security detectors
│       ├── sensitiveFileAccess.ts
│       ├── dangerousCommands.ts
│       ├── unsafeExecution.ts
│       └── bypassDetection.ts
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details.
