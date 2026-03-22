#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { detectors } from '../src/detectors';
import { Finding, ScanReport } from '../src/types';

const SCAN_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.sh', '.yaml', '.yml'];

// Known agent directories
const AGENT_DIRS: Record<string, string[]> = {
  openclaw: [
    '/opt/homebrew/lib/node_modules/openclaw/skills',
    '/opt/homebrew/lib/node_modules/openclaw/extensions/*/skills',
  ],
  claude: [
    '/opt/homebrew/.claude',
    '~/.claude/skills',
    '/opt/homebrew/lib/node_modules/@anthropic-ai/sdk/resources/beta/skills',
  ],
  cursor: [
    '/opt/homebrew/.cursor',
    '~/Library/Application Support/Cursor/User/globalStorage',
  ],
  windsurf: [
    '~/Library/Application Support/Windsurf',
  ],
  antigravity: [
    '~/Library/Application Support/antigravity',
  ],
  copilot: [
    '~/Library/Application Support/github-copilot',
    '~/.github/copilot',
  ],
  kiro: [
    '~/Library/Application Support/kiro',
  ],
  codex: [
    '/opt/homebrew/lib/node_modules/@openai/codex',
    '~/.codex',
  ],
  qoder: [
    '~/Library/Application Support/Qoder',
  ],
  roocode: [
    '~/.roo',
    '~/Library/Application Support/roo-code',
  ],
  gemini: [
    '/opt/homebrew/Cellar/gemini-cli/*/libexec/lib/node_modules/@google/gemini-cli/dist/src/commands/skills',
    '/opt/homebrew/Cellar/gemini-cli/*/libexec/lib/node_modules/@google/gemini-cli/dist/src/commands/extensions/examples/skills',
  ],
  trae: [
    '~/Library/Application Support/trae',
  ],
  opencode: [
    '/opt/homebrew/Cellar/opencode',
    '~/Library/Application Support/ai.opencode.desktop/opencode',
  ],
  continue: [
    '~/.continue',
    '~/Library/Application Support/continue',
  ],
  codebuddy: [
    '~/Library/Application Support/CodeBuddy',
  ],
  droid: [
    '~/Library/Application Support/droid',
  ],
};

const DEFAULT_AGENTS = ['openclaw', 'claude', 'cursor', 'codex', 'gemini', 'opencode'];

function expandGlobs(patterns: string[]): string[] {
  const dirs: string[] = [];
  const { execSync } = require('child_process');
  
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      try {
        const expanded = execSync(`ls -d ${pattern} 2>/dev/null`, { encoding: 'utf-8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        dirs.push(...expanded);
      } catch {
        // Ignore glob errors
      }
    } else {
      const expanded = pattern.replace('~', process.env.HOME || '');
      if (fs.existsSync(expanded)) {
        dirs.push(expanded);
      }
    }
  }
  
  return [...new Set(dirs)];
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        getAllFiles(fullPath, files);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCAN_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Skip permission errors
  }
  
  return files;
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    for (const detector of detectors) {
      try {
        const detections = detector.scan(filePath, content);
        findings.push(...detections);
      } catch (err) {
        // Skip detector errors
      }
    }
  } catch (err) {
    // Skip file read errors
  }
  
  return findings;
}

function scanDir(targetDir: string): ScanReport {
  const files = getAllFiles(targetDir);
  
  const allFindings: Finding[] = [];
  
  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }
  
  return {
    target: targetDir,
    scannedFiles: files.length,
    findings: allFindings,
    generatedAt: new Date().toISOString(),
  };
}

function printReport(report: ScanReport) {
  if (report.findings.length > 0) {
    console.log(`\n📁 ${report.target}: ${report.findings.length} issues (${report.scannedFiles} files)`);
  }
}

// Main scan function
function scan(agents: string[]) {
  console.log('═'.repeat(60));
  console.log('🔒 AGENT SECURITY SCANNER');
  console.log('═'.repeat(60));
  
  // Collect all directories to scan
  const dirsToScan: string[] = [];
  
  for (const agent of agents) {
    const patterns = AGENT_DIRS[agent];
    if (patterns) {
      const expanded = expandGlobs(patterns);
      dirsToScan.push(...expanded);
    }
  }
  
  if (dirsToScan.length === 0) {
    console.log('❌ No directories found to scan!');
    return;
  }
  
  console.log(`\n📂 Scanning ${agents.join(', ')}...`);
  console.log(`Found ${dirsToScan.length} directories:\n`);
  dirsToScan.forEach(d => console.log(`  - ${d}`));
  console.log('');
  
  // Scan each directory
  const allReports: ScanReport[] = [];
  for (const dir of dirsToScan) {
    const report = scanDir(dir);
    allReports.push(report);
    printReport(report);
  }
  
  // Aggregate results
  const totalFiles = allReports.reduce((sum, r) => sum + r.scannedFiles, 0);
  const allFindings = allReports.flatMap(r => r.findings);
  
  // Group by severity
  const bySeverity = {
    critical: allFindings.filter(f => f.severity === 'critical'),
    high: allFindings.filter(f => f.severity === 'high'),
    medium: allFindings.filter(f => f.severity === 'medium'),
    low: allFindings.filter(f => f.severity === 'low'),
  };
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SCAN RESULTS');
  console.log('═'.repeat(60));
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Total security issues found: ${allFindings.length}\n`);
  
  console.log('By Severity:');
  console.log(`  🔴 Critical: ${bySeverity.critical.length}`);
  console.log(`  🟠 High:    ${bySeverity.high.length}`);
  console.log(`  🟡 Medium:  ${bySeverity.medium.length}`);
  console.log(`  🔵 Low:     ${bySeverity.low.length}`);
  console.log('');
  
  // Print findings by severity
  if (allFindings.length > 0) {
    console.log('═'.repeat(60));
    console.log('⚠️  SECURITY ISSUES FOUND');
    console.log('═'.repeat(60));
    
    const severityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      const findings = bySeverity[severity];
      if (findings.length === 0) continue;
      
      console.log(`\n${severity.toUpperCase()} (${findings.length})`);
      console.log('-'.repeat(40));
      
      for (const finding of findings) {
        console.log(`  [${finding.id}] ${finding.title}`);
        console.log(`  📍 ${finding.file}:${finding.line}`);
        console.log(`  💡 ${finding.recommendation}`);
        console.log('');
      }
    }
  } else {
    console.log('✅ No security issues found!');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Scan completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

// CLI
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: scan default agents
    scan(DEFAULT_AGENTS);
    return;
  }
  
  // Parse arguments
  const agents: string[] = [];
  let customDirs: string[] = [];
  
  for (const arg of args) {
    // Handle help and list first
    if (arg === '-h' || arg === '--help') {
      console.log(`
🔒 Agent Security Scanner

Usage:
  ass                      Scan default agents (claude, codex, openclaw, etc)
  ass --all               Scan all known agents
  ass --claude            Scan specific agent
  ass --claude --cursor   Scan multiple agents
  ass /path/to/dir        Scan custom directory
  ass -l, --list          List available agents
  ass -h, --help          Show this help

Examples:
  ass --all               Scan all agents
  ass --claude            Scan Claude Code
  ass --codex             Scan Codex
  ass --gemini            Scan Gemini CLI
  ass ~/.claude/skills    Scan custom directory
      `);
      return;
    }
    
    if (arg === '-l' || arg === '--list') {
      console.log('Available agents:');
      for (const name of Object.keys(AGENT_DIRS)) {
        console.log(`  --${name}`);
      }
      return;
    }
    
    if (arg === '--dir' || arg === '-d') continue;
    
    // Handle 'all' before checking for -- prefix
    if (arg === 'all' || arg === '--all') {
      // Scan all known agents
      agents.push(...Object.keys(AGENT_DIRS));
    } else if (arg.startsWith('--')) {
      const agent = arg.replace('--', '');
      if (AGENT_DIRS[agent]) {
        agents.push(agent);
      } else {
        console.log(`Unknown agent: ${agent}`);
        console.log(`Available agents: ${Object.keys(AGENT_DIRS).join(', ')}`);
      }
    } else if (fs.existsSync(arg)) {
      customDirs.push(arg);
    }
  }
  
  if (agents.length === 0 && customDirs.length === 0) {
    agents.push(...DEFAULT_AGENTS);
  }
  
  if (customDirs.length > 0) {
    console.log('═'.repeat(60));
    console.log('🔒 AGENT SECURITY SCANNER');
    console.log('═'.repeat(60));
    console.log(`\n📂 Scanning custom directories...`);
    
    const allReports: ScanReport[] = [];
    for (const dir of customDirs) {
      const report = scanDir(dir);
      allReports.push(report);
      printReport(report);
    }
    
    const totalFiles = allReports.reduce((sum, r) => sum + r.scannedFiles, 0);
    const allFindings = allReports.flatMap(r => r.findings);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SCAN RESULTS');
    console.log('═'.repeat(60));
    console.log(`Total files scanned: ${totalFiles}`);
    console.log(`Total security issues found: ${allFindings.length}`);
    
    if (allFindings.length > 0) {
      console.log('\nBy Severity:');
      console.log(`  🔴 Critical: ${allFindings.filter(f => f.severity === 'critical').length}`);
      console.log(`  🟠 High:    ${allFindings.filter(f => f.severity === 'high').length}`);
      console.log(`  🟡 Medium:  ${allFindings.filter(f => f.severity === 'medium').length}`);
      console.log(`  🔵 Low:     ${allFindings.filter(f => f.severity === 'low').length}`);
      
      console.log('\n' + '═'.repeat(60));
      for (const f of allFindings) {
        console.log(`\n[${f.severity.toUpperCase()}] ${f.title}`);
        console.log(`  📍 ${f.file}:${f.line}`);
        console.log(`  💡 ${f.recommendation}`);
      }
    } else {
      console.log('\n✅ No security issues found!');
    }
  } else {
    scan(agents);
  }
}

main();
