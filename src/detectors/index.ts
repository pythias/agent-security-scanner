import { Detector } from '../types';
import { sensitiveFileAccessDetector } from './sensitiveFileAccess';
import { dangerousCommandsDetector } from './dangerousCommands';
import { unsafeExecutionDetector } from './unsafeExecution';
import { bypassDetectionDetector } from './bypassDetection';

export const detectors: Detector[] = [
  sensitiveFileAccessDetector,
  dangerousCommandsDetector,
  unsafeExecutionDetector,
  bypassDetectionDetector,
];
