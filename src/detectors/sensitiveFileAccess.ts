import { Detector, Finding } from '../types';

// Sensitive files that agents should not read
const SENSITIVE_PATHS = [
  // OpenClaw config and secrets
  { pattern: '\\.openclaw\\/config', category: 'OpenClaw Secrets', severity: 'critical' as const },
  { pattern: '\\.openclaw\\/credentials', category: 'OpenClaw Credentials', severity: 'critical' as const },
  { pattern: '\\.openclaw\\/secrets', category: 'OpenClaw Secrets', severity: 'critical' as const },
  { pattern: '\\.openclaw\\/env', category: 'OpenClaw Environment', severity: 'critical' as const },
  
  // SSH keys
  { pattern: '\\.ssh\\/id_rsa', category: 'SSH Private Key', severity: 'critical' as const },
  { pattern: '\\.ssh\\/id_ed25519', category: 'SSH Private Key', severity: 'critical' as const },
  { pattern: '\\.ssh\\/known_hosts', category: 'SSH Known Hosts', severity: 'medium' as const },
  
  // Credentials files
  { pattern: '\\.aws\\/credentials', category: 'AWS Credentials', severity: 'critical' as const },
  { pattern: '\\.aws\\/config', category: 'AWS Config', severity: 'high' as const },
  { pattern: '\\.docker\\/config\\.json', category: 'Docker Credentials', severity: 'critical' as const },
  { pattern: '\\.npmrc', category: 'NPM Credentials', severity: 'high' as const },
  { pattern: '\\.pypirc', category: 'PyPI Credentials', severity: 'high' as const },
  
  // System files
  { pattern: '\\/etc\\/passwd', category: 'System File Access', severity: 'high' as const },
  { pattern: '\\/etc\\/shadow', category: 'Shadow File Access', severity: 'critical' as const },
  { pattern: '\\/etc\\/group', category: 'System File Access', severity: 'medium' as const },
  { pattern: '\\/etc\\/sudoers', category: 'Sudoers File', severity: 'critical' as const },
  
  // Environment files
  { pattern: '\\.env$', category: 'Environment Variables', severity: 'high' as const },
  { pattern: '\\.env\\.[a-zA-Z]+$', category: 'Environment Variables', severity: 'high' as const },
  
  // Database configs
  { pattern: '\\.mysql', category: 'MySQL Config', severity: 'high' as const },
  { pattern: '\\.postgresql', category: 'PostgreSQL Config', severity: 'high' as const },
  { pattern: '\\.mongod\\.conf', category: 'MongoDB Config', severity: 'high' as const },
  
  // Cloud credentials
  { pattern: '\\.gcloud\\/credentials', category: 'GCP Credentials', severity: 'critical' as const },
  { pattern: '\\.azure', category: 'Azure Credentials', severity: 'critical' as const },
  
  // Wallet/keys
  { pattern: '\\.eth', category: 'Ethereum Keys', severity: 'critical' as const },
  { pattern: '\\.gnupg', category: 'GPG Keys', severity: 'critical' as const },
  { pattern: '\\.kube\\/config', category: 'Kubernetes Config', severity: 'critical' as const },
  
  // Browser data
  { pattern: 'chrome.*Default.*Login Data', category: 'Browser Passwords', severity: 'critical' as const },
  { pattern: 'chromium.*Default.*Login Data', category: 'Browser Passwords', severity: 'critical' as const },
  { pattern: 'firefox.*logins\\.json', category: 'Browser Passwords', severity: 'critical' as const },
];

export const sensitiveFileAccessDetector: Detector = {
  name: 'Sensitive File Access Detector',
  description: 'Detects attempts to read sensitive files like keys, credentials, and system files.',
  scan: (filePath, content) => {
    const findings: Finding[] = [];
    
    for (const sensitive of SENSITIVE_PATHS) {
      const pattern = new RegExp(sensitive.pattern, 'gi');
      const matches = content.match(pattern);
      
      if (matches) {
        for (const match of matches) {
          const lineNum = content.indexOf(match);
          const lines = content.substring(0, lineNum).split('\n').length;
          
          findings.push({
            id: `SENSITIVE-FILE-${findings.length + 1}`,
            category: sensitive.category,
            severity: sensitive.severity,
            title: `Attempt to access sensitive file: ${match}`,
            description: `This code references a sensitive path that could expose credentials or system information.`,
            recommendation: 'Avoid accessing sensitive files directly. Use environment variables or secure credential storage instead.',
            file: filePath,
            line: lines,
            snippet: match
          });
        }
      }
    }
    
    return findings;
  },
};
