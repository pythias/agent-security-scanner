import * as fs from 'fs';
import * as path from 'path';
import { detectors } from './detectors';
import { Finding, ScanReport } from './types';

const SCAN_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.sh', '.yaml', '.yml'];

// Known agent skill directories
const DEFAULT_SCAN_DIRS = [
  // OpenClaw
  '/opt/homebrew/lib/node_modules/openclaw/skills',
  '/opt/homebrew/lib/node_modules/openclaw/extensions/*/skills',
  
  // Claude Code
  '/opt/homebrew/.claude',
  '~/.claude/skills',
  
  // Cursor
  '/opt/homebrew/.cursor',
  
  // Codex
  '/opt/homebrew/lib/node_modules/@openai/codex',
  
  // Gemini CLI
  '/opt/homebrew/Cellar/gemini-cli/*/libexec/lib/node_modules/@google/gemini-cli/dist/src/commands/skills',
  
  // Anthropic
  '/opt/homebrew/lib/node_modules/@anthropic-ai/sdk/resources/beta/skills',
  
  // OpenAI
  '/opt/homebrew/lib/node_modules/openai/resources/skills',
];

function expandGlobs(patterns: string[]): string[] {
  const dirs: string[] = [];
  const { execSync } = require('child_process');
  
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      try {
        // Use ls to expand glob patterns
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
  
  return [...new Set(dirs)]; // Remove duplicates
}

function getAllFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules and hidden directories
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
  console.log(`\n🔍 Scanning: ${targetDir}`);
  
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
  console.log(`📁 ${report.target}: ${report.findings.length} issues found`);
}

// Main scan function
function scan(targetDirs?: string[]) {
  const dirsToScan = targetDirs && targetDirs.length > 0 
    ? targetDirs 
    : DEFAULT_SCAN_DIRS;
  
  console.log('═'.repeat(60));
  console.log('🔒 AGENT SECURITY SCANNER');
  console.log('═'.repeat(60));
  console.log('\n📂 Scanning directories...');
  
  // Expand globs
  const expandedDirs = expandGlobs(dirsToScan);
  
  if (expandedDirs.length === 0) {
    console.log('❌ No directories found to scan!');
    return;
  }
  
  console.log(`Found ${expandedDirs.length} directories:\n`);
  expandedDirs.forEach(d => console.log(`  - ${d}`));
  console.log('');
  
  // Scan each directory
  const allReports: ScanReport[] = [];
  for (const dir of expandedDirs) {
    const report = scanDir(dir);
    allReports.push(report);
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
  
  console.log('═'.repeat(60));
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

// Get target directory from command line or use defaults
const targetDirs = process.argv.slice(2);
scan(targetDirs);
