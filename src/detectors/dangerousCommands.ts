import { Detector, Finding, Severity } from '../types';

export const dangerousCommandsDetector: Detector = {
  name: 'Dangerous Commands Detector',
  description: 'Detects execution of dangerous shell commands that could harm the system.',
  scan: (filePath, content) => {
    const findings: Finding[] = [];
    
    // Dangerous command patterns
    const patterns: Array<{
      pattern: RegExp;
      category: string;
      severity: Severity;
      title: string;
      description: string;
      recommendation: string;
    }> = [
      // File deletion
      { pattern: /rm\s+(-[rfv]+\s+)*\/.*/g, category: 'Recursive Delete', severity: 'critical', 
        title: 'Recursive delete from root', description: 'Dangerous recursive delete command.', 
        recommendation: 'Never delete files outside the workspace without explicit user approval.' },
      { pattern: /rm\s+(-[rfv]+\s+)*~\//g, category: 'Recursive Delete', severity: 'critical', 
        title: 'Recursive delete from home', description: 'Dangerous recursive delete in home directory.', 
        recommendation: 'Never delete files in user home directory without explicit approval.' },
      { pattern: /rm\s+(-[rf]+\s+)*(system|usr|bin|sbin|etc|var)\//g, category: 'System Delete', severity: 'critical', 
        title: 'Delete system directory', description: 'Attempting to delete system directories.', 
        recommendation: 'Never delete system directories - this can break the operating system.' },
      { pattern: /del\s+\/[sfq]\s+\w:/gi, category: 'Windows Delete', severity: 'critical', 
        title: 'Windows recursive delete', description: 'Windows recursive delete command.', 
        recommendation: 'Never use del /s /q on Windows without explicit approval.' },
      { pattern: /rmdir\s+\/[s]\s+/gi, category: 'Windows Delete', severity: 'critical', 
        title: 'Windows directory delete', description: 'Windows directory deletion command.', 
        recommendation: 'Never use rmdir /s on Windows without approval.' },
      
      // Disk operations
      { pattern: /dd\s+.*of=\/dev\//g, category: 'Disk Write', severity: 'critical', 
        title: 'Direct disk write with dd', description: 'Writing directly to a device with dd.', 
        recommendation: 'Direct disk writes can destroy all data. Never do this without explicit approval.' },
      { pattern: /mkfs\./g, category: 'Format Disk', severity: 'critical', 
        title: 'Format disk', description: 'Formatting a filesystem.', 
        recommendation: 'Formatting destroys all data. Never do this without explicit approval.' },
      { pattern: /fdisk\s+.*delete/g, category: 'Partition Delete', severity: 'critical', 
        title: 'Delete disk partition', description: 'Deleting disk partitions.', 
        recommendation: 'Partition deletion destroys data. Never do this without explicit approval.' },
      { pattern: /parted\s+.*rm/g, category: 'Partition Delete', severity: 'critical', 
        title: 'Delete partition with parted', description: 'Deleting partitions with parted.', 
        recommendation: 'Never delete partitions without explicit user approval.' },
      
      // Network attacks
      { pattern: /nc\s+(-[elvpw]+\s+)*-e\s+/gi, category: 'Netcat Backdoor', severity: 'critical', 
        title: 'Netcat backdoor', description: 'Netcat with execute flag for backdoor.', 
        recommendation: 'Never create network backdoors - this is malicious behavior.' },
      { pattern: /nmap\s+(-O|-sS|-sV|-A)/gi, category: 'Port Scan', severity: 'medium', 
        title: 'Network port scanning', description: 'Running network port scanner.', 
        recommendation: 'Port scanning may violate policies. Ensure you have authorization.' },
      { pattern: /curl.*--resolve.*localhost:0/g, category: 'SSRF', severity: 'high', 
        title: 'Potential SSRF attack', description: 'Using curl with --resolve to bypass localhost restrictions.', 
        recommendation: 'Be careful with URL manipulations that could bypass security checks.' },
      { pattern: /wget.*--no-check-certificate/g, category: 'Insecure Download', severity: 'medium', 
        title: 'Skip SSL certificate verification', description: 'Downloading without SSL verification.', 
        recommendation: 'Skipping SSL verification is insecure. Use proper certificate validation.' },
      
      // Privilege escalation
      { pattern: /chmod\s+4777/g, category: 'Privilege Escalation', severity: 'critical', 
        title: 'Set SUID bit', description: 'Setting SUID bit on a file.', 
        recommendation: 'SUID binaries can be security risks. Ensure you have proper authorization.' },
      { pattern: /chmod\s+777/g, category: 'Permission Issue', severity: 'high', 
        title: 'World-writable permissions', description: 'Setting world-writable permissions.', 
        recommendation: 'World-writable permissions are a security risk.' },
      { pattern: /usermod\s+(-aG|-G)\s+sudo/g, category: 'Privilege Escalation', severity: 'critical', 
        title: 'Add user to sudo group', description: 'Adding user to sudo group.', 
        recommendation: 'Never modify user groups without explicit approval.' },
      { pattern: /passwd\s+root/g, category: 'Privilege Escalation', severity: 'critical', 
        title: 'Change root password', description: 'Attempting to change root password.', 
        recommendation: 'Never change system passwords without explicit approval.' },
      
      // Process killing
      { pattern: /kill\s+-9\s+-1/g, category: 'Process Kill', severity: 'critical', 
        title: 'Kill all processes', description: 'Killing all processes on the system.', 
        recommendation: 'Killing all processes will crash the system. Never do this.' },
      { pattern: /pkill\s+-9/g, category: 'Process Kill', severity: 'high', 
        title: 'Force kill processes', description: 'Force killing processes.', 
        recommendation: 'Be careful with force killing processes.' },
      { pattern: /shutdown|reboot|init\s+0|init\s+6/g, category: 'System Shutdown', severity: 'critical', 
        title: 'System shutdown/reboot', description: 'Shutting down or rebooting the system.', 
        recommendation: 'Never shutdown or reboot the system without explicit approval.' },
      
      // Modifying system files
      { pattern: />\s*\/etc\/passwd/g, category: 'System File Modify', severity: 'critical', 
        title: 'Overwrite /etc/passwd', description: 'Overwriting system password file.', 
        recommendation: 'Never modify /etc/passwd - this can break the system and create security issues.' },
      { pattern: />\s*\/etc\/hosts/g, category: 'System File Modify', severity: 'high', 
        title: 'Overwrite /etc/hosts', description: 'Overwriting hosts file.', 
        recommendation: 'Modifying /etc/hosts can affect DNS resolution.' },
      { pattern: /echo.*>\s*\/proc\//g, category: 'Proc Modify', severity: 'high', 
        title: 'Write to /proc', description: 'Writing to /proc filesystem.', 
        recommendation: 'Be careful when writing to /proc - it can affect kernel state.' },
      
      // Crypto mining
      { pattern: /xmrig|minergate|minerd|cgminer/gi, category: 'Crypto Mining', severity: 'critical', 
        title: 'Cryptocurrency miner', description: 'Running cryptocurrency mining software.', 
        recommendation: 'Never run cryptocurrency miners - this is unauthorized resource usage.' },
      
      // Remote code execution
      { pattern: /curl\s+.*\|\s*(bash|sh|zsh)/gi, category: 'Remote Code Execution', severity: 'critical', 
        title: 'Pipe curl to shell', description: 'Downloading and executing script from remote URL.', 
        recommendation: 'Never execute remote scripts without verification.' },
      { pattern: /wget\s+.*-O-\s*\|\s*(bash|sh|zsh)/gi, category: 'Remote Code Execution', severity: 'critical', 
        title: 'Pipe wget to shell', description: 'Downloading and executing script from remote URL.', 
        recommendation: 'Never execute remote scripts without verification.' },
    ];
    
    for (const p of patterns) {
      const matches = content.match(p.pattern);
      if (matches) {
        for (const match of matches) {
          const lineNum = content.indexOf(match);
          const lines = content.substring(0, lineNum).split('\n').length;
          
          findings.push({
            id: `DANGER-${findings.length + 1}`,
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
