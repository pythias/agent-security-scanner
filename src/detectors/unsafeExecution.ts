import { Detector, Finding, Severity } from '../types';

export const unsafeExecutionDetector: Detector = {
  name: 'Unsafe Execution Detector',
  description: 'Detects unsafe code execution patterns that could be exploited.',
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
      // Dynamic code execution
      { pattern: /eval\s*\(/g, category: 'Code Execution', severity: 'high', 
        title: 'Use of eval()', description: 'eval() executes arbitrary code.', 
        recommendation: 'Avoid eval() - it can execute malicious code if input is not properly sanitized.' },
      { pattern: /new\s+Function\s*\(/g, category: 'Code Execution', severity: 'high', 
        title: 'Use of new Function()', description: 'new Function() creates executable code from strings.', 
        recommendation: 'Avoid new Function() - it has the same risks as eval().' },
      { pattern: /setTimeout\s*\(\s*['"`]/g, category: 'Code Execution', severity: 'high', 
        title: 'setTimeout with string', description: 'setTimeout with string argument executes code.', 
        recommendation: 'Pass functions to setTimeout, not strings.' },
      { pattern: /setInterval\s*\(\s*['"`]/g, category: 'Code Execution', severity: 'high', 
        title: 'setInterval with string', description: 'setInterval with string argument executes code.', 
        recommendation: 'Pass functions to setInterval, not strings.' },
      { pattern: /execScript\s*\(/gi, category: 'Code Execution', severity: 'high', 
        title: 'execScript call', description: 'execScript executes code in global scope.', 
        recommendation: 'Avoid execScript - it can execute arbitrary code.' },
      
      // Shell execution with user input
      { pattern: /exec\s*\(\s*[^)]*(req\.|body|query|params|argv)/gi, category: 'Command Injection', severity: 'critical', 
        title: 'exec with user input', description: 'Passing user input directly to exec().', 
        recommendation: 'Never pass user input to exec() without sanitization. Use parameterized commands.' },
      { pattern: /execSync\s*\(\s*[^)]*(req\.|body|query|params|argv)/gi, category: 'Command Injection', severity: 'critical', 
        title: 'execSync with user input', description: 'Passing user input directly to execSync().', 
        recommendation: 'Never pass user input to execSync() without sanitization.' },
      { pattern: /spawn\s*\(\s*['"`][^'"]*\$/g, category: 'Command Injection', severity: 'high', 
        title: 'spawn with template literal', description: 'spawn with interpolated variables in command.', 
        recommendation: 'Use spawn with array arguments instead of shell strings.' },
      { pattern: /spawnSync\s*\(\s*['"`][^'"]*\$/g, category: 'Command Injection', severity: 'high', 
        title: 'spawnSync with template literal', description: 'spawnSync with interpolated variables.', 
        recommendation: 'Use spawnSync with array arguments instead of shell strings.' },
      
      // Child process without sanitization
      { pattern: /child_process\.(exec|execSync|spawn)\s*\([^)]*\+/g, category: 'Command Injection', severity: 'critical', 
        title: 'String concatenation in command', description: 'Concatenating strings to build commands.', 
        recommendation: 'Use array arguments for commands to avoid shell injection.' },
      
      // Unsafe file operations
      { pattern: /readFile\s*\(\s*[^)]*(req\.|body|query|params)/gi, category: 'Path Traversal', severity: 'high', 
        title: 'readFile with user input', description: 'Reading file using user-controlled path.', 
        recommendation: 'Validate and sanitize file paths before reading.' },
      { pattern: /writeFile\s*\(\s*[^)]*(req\.|body|query|params)/gi, category: 'Path Traversal', severity: 'critical', 
        title: 'writeFile with user input', description: 'Writing file using user-controlled path.', 
        recommendation: 'Validate and sanitize file paths before writing. Never allow arbitrary file writes.' },
      { pattern: /unlink\s*\(\s*[^)]*(req\.|body|query|params)/gi, category: 'Arbitrary Delete', severity: 'critical', 
        title: 'unlink with user input', description: 'Deleting file using user-controlled path.', 
        recommendation: 'Never delete files based on user input without strict validation.' },
      { pattern: /rmSync\s*\(\s*[^)]*(req\.|body|query|params)/gi, category: 'Arbitrary Delete', severity: 'critical', 
        title: 'rmSync with user input', description: 'Deleting file using user-controlled path.', 
        recommendation: 'Never delete files based on user input without strict validation.' },
      
      // HTTP requests to internal services
      { pattern: /fetch\s*\(\s*[^)]*(req\.|body|query|params).*localhost/gi, category: 'Internal Service Access', severity: 'medium', 
        title: 'fetch to localhost', description: 'Making HTTP request to localhost.', 
        recommendation: 'Be careful accessing internal services - ensure proper authentication.' },
      { pattern: /axios\.(get|post|put|delete)\s*\(\s*[^)]*(req\.|body|query|params).*localhost/gi, category: 'Internal Service Access', severity: 'medium', 
        title: 'axios request to localhost', description: 'Making axios request to localhost.', 
        recommendation: 'Be careful accessing internal services - ensure proper authentication.' },
      
      // Deserialization
      { pattern: /JSON\.parse\s*\(\s*[^)]*(req\.|body)/gi, category: 'Deserialization', severity: 'low', 
        title: 'JSON.parse with user input', description: 'Parsing JSON from user input.', 
        recommendation: 'Ensure input is valid JSON before parsing.' },
      { pattern: /yaml\.load\s*\(/gi, category: 'Deserialization', severity: 'high', 
        title: 'Unsafe YAML load', description: 'yaml.load can execute arbitrary code.', 
        recommendation: 'Use yaml.safeLoad() instead of yaml.load().' },
      { pattern: /pickle\.load\s*\(/gi, category: 'Deserialization', severity: 'high', 
        title: 'Unsafe pickle load', description: 'pickle.load can execute arbitrary code.', 
        recommendation: 'Never unpickle untrusted data.' },
      
      // SQL
      { pattern: /query\s*\(\s*['"`].*\+/gi, category: 'SQL Injection', severity: 'high', 
        title: 'SQL query with string concatenation', description: 'Building SQL queries with string concatenation.', 
        recommendation: 'Use parameterized queries to prevent SQL injection.' },
    ];
    
    for (const p of patterns) {
      const matches = content.match(p.pattern);
      if (matches) {
        for (const match of matches) {
          const lineNum = content.indexOf(match);
          const lines = content.substring(0, lineNum).split('\n').length;
          
          findings.push({
            id: `UNSAFE-${findings.length + 1}`,
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
