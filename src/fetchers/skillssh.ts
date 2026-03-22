import * as https from 'https';
import * as http from 'http';

export interface SkillsShSkill {
  source: string;      // e.g., "anthropics/skills"
  skillId: string;      // e.g., "frontend-design"
  name: string;        // e.g., "frontend-design"
  installs: number;
  repo?: string;
}

export interface SkillsShFetcherOptions {
  limit?: number;
  source?: string;     // Filter by source repo
}

interface SkillsShResponse {
  items: SkillsShSkill[];
  total: number;
}

function fetchUrl(url: string, timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        fetchUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Parse skills from skills.sh HTML page
export async function listSkillsShSkills(options: SkillsShFetcherOptions = {}): Promise<SkillsShSkill[]> {
  const skills: SkillsShSkill[] = [];
  const limit = options.limit || 50;

  try {
    // Fetch the skills.sh explore page
    const html = await fetchUrl('https://skills.sh');
    
    // Extract skill data from the embedded JSON
    const scriptMatch = html.match(/initialSkills":\s*(\[.*?\])/s);
    if (scriptMatch) {
      try {
        const skillsData = JSON.parse(scriptMatch[1]);
        let filtered = skillsData as SkillsShSkill[];
        
        if (options.source) {
          filtered = filtered.filter(s => s.source === options.source);
        }
        
        for (const skill of filtered.slice(0, limit)) {
          skills.push({
            source: skill.source,
            skillId: skill.skillId,
            name: skill.name,
            installs: skill.installs,
          });
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse skills.sh JSON data');
      }
    }

    // Also try to extract from HTML structure
    if (skills.length === 0) {
      const skillPattern = /href="\/([^/]+)\/([^/]+)\/([^"]+)"/g;
      const seen = new Set<string>();
      let match;
      
      while ((match = skillPattern.exec(html)) !== null && skills.length < limit) {
        const source = match[1];
        const repo = match[2];
        const skillId = match[3];
        const key = `${source}/${skillId}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          skills.push({
            source: `${source}/${repo}`,
            skillId,
            name: skillId,
            installs: 0,
          });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to fetch skills.sh: ${error}`);
  }

  return skills;
}

// Fetch skill content from skills.sh (via GitHub raw content)
export async function fetchSkillsShSkillContent(skill: SkillsShSkill): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  
  // Skills.sh stores skills in GitHub repos, try to fetch from raw GitHub
  const [org, repo] = skill.source.split('/');
  if (!org || !repo) return contents;

  const commonPaths = [
    `SKILL.md`,
    `skill.md`,
    `README.md`,
  ];

  for (const filePath of commonPaths) {
    const rawUrl = `https://raw.githubusercontent.com/${org}/${repo}/main/${filePath}`;
    try {
      const content = await fetchUrl(rawUrl);
      if (content && content.length > 0) {
        contents.set(filePath, content);
        break; // Found SKILL.md, no need to try others
      }
    } catch {
      // Try next path
    }

    // Try master branch as fallback
    const masterUrl = `https://raw.githubusercontent.com/${org}/${repo}/master/${filePath}`;
    try {
      const content = await fetchUrl(masterUrl);
      if (content && content.length > 0) {
        contents.set(filePath, content);
        break;
      }
    } catch {
      // Try next path
    }
  }

  return contents;
}

// Get all unique sources/repos from skills.sh
export async function getSkillsShSources(): Promise<string[]> {
  const skills = await listSkillsShSkills({ limit: 500 });
  const sources = new Set<string>();
  
  for (const skill of skills) {
    sources.add(skill.source);
  }
  
  return Array.from(sources).sort();
}
