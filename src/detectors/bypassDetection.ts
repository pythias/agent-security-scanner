import { Detector, Finding, Severity } from '../types';

export const bypassDetectionDetector: Detector = {
  name: 'Security Bypass Detector',
  description: 'Detects attempts to bypass security measures or access controls.',
  scan: (filePath, content) => {
    const findings: Finding[] = [];
    
    const patterns: Array<{
      pattern: RegExp;
      category: string;
      severity: Severity;
      title: string;
      description: string;
      recommendation: string;
    }> = [
      // Auth bypass
      { pattern: /skip.*auth|disable.*auth|bypass.*auth/gi, category: 'Auth Bypass', severity: 'critical', 
        title: 'Authentication bypass attempt', description: 'Code attempts to skip authentication.', 
        recommendation: 'Never bypass authentication - this is a serious security issue.' },
      { pattern: /process\.env\.(SKIP_AUTH|BYPASS_AUTH|DISABLE_AUTH)/gi, category: 'Auth Bypass', severity: 'critical', 
        title: 'Environment-based auth bypass', description: 'Environment variable can disable authentication.', 
        recommendation: 'Never use environment variables to disable authentication in production.' },
      
      // Sandbox escape
      { pattern: /--no-sandbox|--disable-sandbox/gi, category: 'Sandbox Escape', severity: 'critical', 
        title: 'Disable sandbox', description: 'Attempting to disable security sandbox.', 
        recommendation: 'Never disable sandboxes - they provide critical security isolation.' },
      { pattern: /--allow-root|--privileged/gi, category: 'Privilege Escape', severity: 'high', 
        title: 'Run as root/privileged', description: 'Attempting to run with elevated privileges.', 
        recommendation: 'Running as root is dangerous. Use least-privilege principles.' },
      { pattern: /--dangerously-skip-permissions/gi, category: 'Permission Bypass', severity: 'critical', 
        title: 'Skip permissions check', description: 'Attempting to skip permission checks.', 
        recommendation: 'Never skip permission checks - they protect users and systems.' },
      
      // SSL/TLS bypass
      { pattern: /rejectUnauthorized\s*:\s*false/gi, category: 'SSL Bypass', severity: 'high', 
        title: 'Disable SSL verification', description: 'Disabling SSL certificate verification.', 
        recommendation: 'Never disable SSL verification - it enables man-in-the-middle attacks.' },
      { pattern: /insecure\s*:\s*true/gi, category: 'SSL Bypass', severity: 'high', 
        title: 'Insecure mode enabled', description: 'Enabling insecure mode.', 
        recommendation: 'Never enable insecure modes in production.' },
      { pattern: /strictSSL\s*:\s*false/gi, category: 'SSL Bypass', severity: 'high', 
        title: 'Disable strict SSL', description: 'Disabling strict SSL verification.', 
        recommendation: 'Never disable strict SSL - use proper certificates.' },
      
      // Rate limiting bypass
      { pattern: /disable.*rate.*limit|bypass.*rate.*limit/gi, category: 'Rate Limit Bypass', severity: 'medium', 
        title: 'Rate limiting bypass', description: 'Attempting to bypass rate limiting.', 
        recommendation: 'Rate limits protect services from abuse. Respect them.' },
      
      // CORS bypass
      { pattern: /origin\s*:\s*['"]*\*['"]*|Access-Control-Allow-Origin\s*:\s*['"]*\*['"]*/gi, category: 'CORS Bypass', severity: 'medium', 
        title: 'Allow all CORS', description: 'Setting permissive CORS policy.', 
        recommendation: 'Be specific with CORS origins instead of using wildcards.' },
      
      // Permission requests
      { pattern: /--grant-all-permissions|--allow-all/gi, category: 'Permission Escalation', severity: 'high', 
        title: 'Grant all permissions', description: 'Requesting all possible permissions.', 
        recommendation: 'Request only the minimum permissions needed.' },
      { pattern: /rootDir\s*:\s*['"]\/['"]/gi, category: 'Path Escape', severity: 'high', 
        title: 'Root directory access', description: 'Setting root directory to /', 
        recommendation: 'Never allow access to the entire filesystem.' },
      { pattern: /allowedPaths\s*:\s*\[['\"]\/.*['\"]/gi, category: 'Path Escape', severity: 'high', 
        title: 'Allow root path access', description: 'Allowing access to root path.', 
        recommendation: 'Restrict file access to specific directories.' },
      
      // Eval alternatives
      { pattern: /Function\s*\(\s*['"]/gi, category: 'Code Execution', severity: 'high', 
        title: 'Dynamic function creation', description: 'Creating functions from strings.', 
        recommendation: 'Avoid creating functions from strings - use alternatives like JSON.parse.' },
      
      // Prototype pollution
      { pattern: /\.__proto__|prototype\s*=/gi, category: 'Prototype Pollution', severity: 'high', 
        title: 'Prototype manipulation', description: 'Attempting to modify object prototypes.', 
        recommendation: 'Never allow user input to modify prototypes - this can lead to code execution.' },
      
      // XSS patterns
      { pattern: /innerHTML\s*=|dangerouslySetInnerHTML/gi, category: 'XSS', severity: 'medium', 
        title: 'Unsafe HTML assignment', description: 'Setting innerHTML directly.', 
        recommendation: 'Sanitize HTML before assigning to innerHTML.' },
      
      // Path traversal
      { pattern: /path\.join\s*\([^)]*\.\.\//gi, category: 'Path Traversal', severity: 'high', 
        title: 'Path traversal detected', description: 'Using ../ in path operations.', 
        recommendation: 'Validate paths and prevent directory traversal attacks.' },
    ];
    
    for (const p of patterns) {
      const matches = content.match(p.pattern);
      if (matches) {
        for (const match of matches) {
          const lineNum = content.indexOf(match);
          const lines = content.substring(0, lineNum).split('\n').length;
          
          findings.push({
            id: `BYPASS-${findings.length + 1}`,
            category: p.category,
            severity: p.severity,
            title: p.title,
            description: p.description,
            recommendation: p.recommendation,
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
