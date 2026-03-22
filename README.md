# 🔒 Agent Security Scanner

A security scanning tool that detects potentially dangerous patterns in AI agent skills and tools. Helps identify security vulnerabilities that could allow agents to access sensitive files, execute dangerous commands, or bypass security measures.

## ✨ Features

- **Sensitive File Access Detection** - Detects attempts to access credentials, keys, SSH keys, system files
- **Dangerous Commands Detection** - Identifies harmful shell commands (rm -rf, dd, mkfs, etc.)
- **Unsafe Execution Detection** - Finds code execution risks (eval, exec, command injection)
- **Security Bypass Detection** - Detects sandbox escapes, auth bypasses, SSL verification bypass

## 📋 Supported Detections

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

## 🚀 Usage

```bash
# Clone the repo
git clone https://github.com/yourusername/agent-security-scanner.git
cd agent-security-scanner

# Install dependencies
npm install

# Run scan on default directories
npm run scan

# Scan a specific directory
npm run scan /path/to/skills

# Scan multiple directories
npm run scan /path/to/skills1 /path/to/skills2
```

## 📁 Default Scan Locations

The scanner automatically scans these directories:
- OpenClaw skills & extensions
- Claude Code (`~/.claude`)
- Cursor
- Codex
- Gemini CLI
- Anthropic SDK skills
- OpenAI skills

## 📊 Output Example

```
════════════════════════════════════════════════════════════
🔒 AGENT SECURITY SCANNER
════════════════════════════════════════════════════════════

📂 Scanning directories...
Found 9 directories:
  - /opt/homebrew/lib/node_modules/openclaw/skills
  - ...

════════════════════════════════════════════════════════════
📊 SCAN RESULTS
════════════════════════════════════════════════════════════
Total files scanned: 120
Total security issues found: 4

By Severity:
  🔴 Critical: 3
  🟠 High:    1

⚠️  SECURITY ISSUES FOUND
════════════════════════════════════════════════════════════

CRITICAL (3)
  [BYPASS-1] Skip permissions check
  📍 skills/coding-agent/SKILL.md:24
  💡 Never skip permission checks
```

## 🛠️ Project Structure

```
agent-security-scanner/
├── src/
│   ├── scanner.ts           # Main scanning logic
│   ├── types.ts             # TypeScript types
│   └── detectors/           # Security detectors
│       ├── sensitiveFileAccess.ts
│       ├── dangerousCommands.ts
│       ├── unsafeExecution.ts
│       └── bypassDetection.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details.
