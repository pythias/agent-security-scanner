export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  file: string;
  line: number;
  snippet: string;
}

export interface Detector {
  name: string;
  description: string;
  scan: (filePath: string, content: string) => Finding[];
}

export interface ScanReport {
  target: string;
  scannedFiles: number;
  findings: Finding[];
  generatedAt: string;
}
