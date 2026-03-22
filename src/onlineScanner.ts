import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectors } from './detectors';
import { Finding, ScanReport } from './types';
import {
  listClawHubSkills,
  inspectSkill,
  fetchSkillFiles,
  downloadSkillToTemp,
  type ClawHubSkill,
} from './fetchers/clawhub';
import {
  listSkillsShSkills,
  fetchSkillsShSkillContent,
  type SkillsShSkill,
} from './fetchers/skillssh';

export interface OnlineScanOptions {
  // ClawHub options
  clawhub?: {
    search?: string;
    slugs?: string[];
    limit?: number;
  };

  // Skills.sh options
  skillssh?: {
    limit?: number;
    source?: string;
  };

  // Scan options
  scanFiles?: string[];  // Which files to scan (default: ['SKILL.md', 'skill.md'])
  tempDir?: string;       // Temp directory for downloaded skills
}

const SCAN_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.sh', '.yaml', '.yml'];

export async function scanOnlineSkills(options: OnlineScanOptions = {}): Promise<ScanReport[]> {
  const reports: ScanReport[] = [];
  const tempBaseDir = options.tempDir || fs.mkdtempSync(path.join(os.tmpdir(), 'ass-online-'));

  console.log('\n🌐 Scanning online skill repositories...\n');

  // Scan ClawHub
  if (options.clawhub) {
    const clawhubReports = await scanClawHub(options.clawhub, tempBaseDir, options.scanFiles);
    reports.push(...clawhubReports);
  }

  // Scan skills.sh
  if (options.skillssh) {
    const skillsshReports = await scanSkillsSh(options.skillssh, options.scanFiles);
    reports.push(...skillsshReports);
  }

  // If no specific source specified, scan both (with small defaults)
  if (!options.clawhub && !options.skillssh) {
    console.log('📦 Fetching skills from ClawHub (defaulting to top 5)...');
    const clawhubReports = await scanClawHub({ limit: 5 }, tempBaseDir, options.scanFiles);
    reports.push(...clawhubReports);

    console.log('\n📦 Fetching skills from skills.sh (defaulting to top 5)...');
    const skillsshReports = await scanSkillsSh({ limit: 5 }, options.scanFiles);
    reports.push(...skillsshReports);
  }

  return reports;
}

async function scanClawHub(
  options: OnlineScanOptions['clawhub'],
  tempBaseDir: string,
  scanFiles?: string[]
): Promise<ScanReport[]> {
  const reports: ScanReport[] = [];
  const filesToScan = scanFiles || ['SKILL.md'];

  if (options?.slugs && options.slugs.length > 0) {
    // Scan specific skills
    for (const slug of options.slugs) {
      console.log(`\n🔍 Scanning ClawHub skill: ${slug}`);
      const skill = inspectSkill(slug);
      if (!skill) continue;

      const skillDir = downloadSkillToTemp(slug, path.join(tempBaseDir, `clawhub-${slug}`));
      if (skillDir) {
        const report = scanLocalDir(skillDir, `clawhub:${slug}`, filesToScan);
        reports.push(report);
      }
    }
  } else if (options?.search) {
    // Search and scan
    console.log(`\n🔍 Searching ClawHub: "${options.search}"`);
    const skills = listClawHubSkills({ search: options.search, limit: options.limit || 20 });
    console.log(`Found ${skills.length} skills\n`);

    for (const skill of skills) {
      console.log(`📦 Scanning: ${skill.slug}...`);
      const skillDir = downloadSkillToTemp(skill.slug, path.join(tempBaseDir, `clawhub-${skill.slug}`));
      if (skillDir) {
        const report = scanLocalDir(skillDir, `clawhub:${skill.slug}`, filesToScan);
        reports.push(report);
      }
    }
  } else {
    // Default: search for security-related skills
    console.log('🔍 Searching ClawHub for security-related skills...');
    const skills = listClawHubSkills({ search: 'security', limit: options?.limit || 5 });
    console.log(`Found ${skills.length} skills\n`);

    for (const skill of skills) {
      console.log(`📦 Scanning: ${skill.slug}...`);
      const skillDir = downloadSkillToTemp(skill.slug, path.join(tempBaseDir, `clawhub-${skill.slug}`));
      if (skillDir) {
        const report = scanLocalDir(skillDir, `clawhub:${skill.slug}`, filesToScan);
        reports.push(report);
      }
    }
  }

  return reports;
}

async function scanSkillsSh(
  options: OnlineScanOptions['skillssh'],
  scanFiles?: string[]
): Promise<ScanReport[]> {
  const reports: ScanReport[] = [];
  const filesToScan = scanFiles || ['SKILL.md', 'skill.md'];

  console.log('Fetching skills from skills.sh...');
  const skills = await listSkillsShSkills({ limit: options?.limit || 10, source: options?.source });
  console.log(`Found ${skills.length} skills\n`);

  // Scan top skills by installs
  const sortedSkills = skills.sort((a, b) => b.installs - a.installs).slice(0, options?.limit || 5);

  for (const skill of sortedSkills) {
    console.log(`📦 Scanning: ${skill.source}/${skill.skillId}...`);
    
    try {
      const contents = await fetchSkillsShSkillContent(skill);
      
      if (contents.size > 0) {
        // Create temp file for scanning
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `ass-skillsh-`));
        
        for (const [filename, content] of contents) {
          const filePath = path.join(tempDir, filename);
          fs.writeFileSync(filePath, content, 'utf-8');
        }

        const report = scanLocalDir(tempDir, `skills.sh:${skill.source}/${skill.skillId}`, filesToScan);
        reports.push(report);

        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to scan skill ${skill.skillId}: ${error}`);
    }
  }

  return reports;
}

function scanLocalDir(targetDir: string, targetName: string, allowedFiles?: string[]): ScanReport {
  console.log(`  📂 Scanning: ${targetDir}`);

  const files = getAllFiles(targetDir, allowedFiles);
  const allFindings: Finding[] = [];

  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  // Cleanup temp dir
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  return {
    target: targetName,
    scannedFiles: files.length,
    findings: allFindings,
    generatedAt: new Date().toISOString(),
  };
}

function getAllFiles(dir: string, allowedFiles?: string[]): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, allowedFiles));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCAN_EXTENSIONS.includes(ext)) {
          if (!allowedFiles || allowedFiles.includes(entry.name) || allowedFiles.includes(path.basename(entry.name))) {
            files.push(fullPath);
          }
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

// Utility function to print aggregated report
export function printOnlineReport(reports: ScanReport[]) {
  const totalFiles = reports.reduce((sum, r) => sum + r.scannedFiles, 0);
  const allFindings = reports.flatMap(r => r.findings);

  const bySeverity = {
    critical: allFindings.filter(f => f.severity === 'critical'),
    high: allFindings.filter(f => f.severity === 'high'),
    medium: allFindings.filter(f => f.severity === 'medium'),
    low: allFindings.filter(f => f.severity === 'low'),
  };

  console.log('\n' + '═'.repeat(60));
  console.log('🌐 ONLINE SKILLS SCAN RESULTS');
  console.log('═'.repeat(60));
  console.log(`\nTotal skills scanned: ${reports.length}`);
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Total security issues found: ${allFindings.length}\n`);

  console.log('By Severity:');
  console.log(`  🔴 Critical: ${bySeverity.critical.length}`);
  console.log(`  🟠 High:    ${bySeverity.high.length}`);
  console.log(`  🟡 Medium:  ${bySeverity.medium.length}`);
  console.log(`  🔵 Low:     ${bySeverity.low.length}`);

  if (allFindings.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  SECURITY ISSUES FOUND');
    console.log('═'.repeat(60));

    const severityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

    for (const severity of severityOrder) {
      const findings = bySeverity[severity];
      if (findings.length === 0) continue;

      console.log(`\n${severity.toUpperCase()} (${findings.length})`);
      console.log('-'.repeat(40));

      for (const finding of findings.slice(0, 10)) {
        console.log(`  [${finding.id}] ${finding.title}`);
        console.log(`  📍 ${finding.file}:${finding.line}`);
        console.log(`  💡 ${finding.recommendation}`);
        console.log('');
      }

      if (findings.length > 10) {
        console.log(`  ... and ${findings.length - 10} more`);
      }
    }
  } else {
    console.log('\n✅ No security issues found in online skills!');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Scan completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}
