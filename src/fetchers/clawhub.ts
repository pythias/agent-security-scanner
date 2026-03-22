import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ClawHubSkill {
  slug: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  tags: string[];
  license?: string;
  securityStatus?: string;
  files: string[];
}

export interface ClawHubFetcherOptions {
  limit?: number;
  search?: string;
  slugs?: string[];
}

function execClawHub(args: string[], timeoutMs = 30000): string {
  try {
    return execSync(`clawhub ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error: any) {
    if (error.status === 0) {
      return error.stdout || '';
    }
    throw new Error(`clawhub failed: ${error.message}`);
  }
}

export function listClawHubSkills(options: ClawHubFetcherOptions = {}): ClawHubSkill[] {
  const skills: ClawHubSkill[] = [];

  if (options.search) {
    // Use search to find skills
    const output = execClawHub(['search', options.search, '--limit', String(options.limit || 20)]);
    const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('-') && !l.startsWith('Search'));

    for (const line of lines) {
      const match = line.match(/^\s*(\S+)\s+(.+?)\s+\((\d+\.\d+)\)\s*$/);
      if (match) {
        skills.push({
          slug: match[1],
          name: match[2],
          description: '',
          owner: '',
          version: match[3],
          tags: [],
          files: [],
        });
      }
    }
  } else if (options.slugs && options.slugs.length > 0) {
    // Inspect specific skills
    for (const slug of options.slugs) {
      try {
        const output = execClawHub(['inspect', slug, '--files']);
        const skill = parseInspectOutput(output, slug);
        if (skill) {
          skills.push(skill);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to inspect skill: ${slug}`);
      }
    }
  }

  return skills;
}

export function fetchSkillFiles(slug: string, files: string[] = ['SKILL.md']): Map<string, string> {
  const contents = new Map<string, string>();

  for (const file of files) {
    try {
      const output = execClawHub(['inspect', slug, '--file', file]);
      contents.set(file, output);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch file ${file} from skill ${slug}`);
    }
  }

  return contents;
}

export function inspectSkill(slug: string): ClawHubSkill | null {
  try {
    const output = execClawHub(['inspect', slug, '--files']);
    return parseInspectOutput(output, slug);
  } catch (error) {
    console.warn(`⚠️ Failed to inspect skill: ${slug}`);
    return null;
  }
}

function parseInspectOutput(output: string, slug: string): ClawHubSkill | null {
  const lines = output.split('\n');
  const skill: ClawHubSkill = {
    slug,
    name: '',
    description: '',
    owner: '',
    version: '',
    tags: [],
    files: [],
  };

  let inFiles = false;
  for (const line of lines) {
    if (line.startsWith('- Fetching')) continue;

    if (inFiles) {
      const fileMatch = line.match(/^(.+?)\s+[\d.]+\w+\s+\w+\s+(.+)$/);
      if (fileMatch) {
        skill.files.push(fileMatch[1]);
      }
    } else if (line.startsWith('Summary:')) {
      skill.description = line.substring(8).trim();
    } else if (line.startsWith('Owner:')) {
      skill.owner = line.substring(6).trim();
    } else if (line.startsWith('Latest:')) {
      skill.version = line.substring(7).trim();
    } else if (line.startsWith('Tags:')) {
      const tagsStr = line.substring(5).trim();
      skill.tags = tagsStr.split(',').map(t => t.trim());
    } else if (line.startsWith('License:')) {
      skill.license = line.substring(8).trim();
    } else if (line.startsWith('Security:')) {
      skill.securityStatus = line.substring(9).trim();
    } else if (line.startsWith('Files:')) {
      inFiles = true;
    } else if (!inFiles && !skill.name && line.trim()) {
      // First non-empty line that isn't a known field is likely the name
      if (!line.includes(':')) {
        skill.name = line.trim();
      }
    }
  }

  return skill.name ? skill : null;
}

// Download skill to temp directory for scanning
export function downloadSkillToTemp(slug: string, tempDir?: string): string | null {
  const tmpDir = tempDir || fs.mkdtempSync(path.join(os.tmpdir(), `ass-${slug}-`));

  try {
    execClawHub(['install', slug, '--dir', tmpDir, '--no-input']);
    return tmpDir;
  } catch (error) {
    console.warn(`⚠️ Failed to install skill ${slug} to temp directory`);
    return null;
  }
}
