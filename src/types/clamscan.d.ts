declare module 'clamscan' {
  export interface ClamScanOptions {
    clamdscan?: {
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
    };
    preference?: string;
  }

  export interface ScanResult {
    isInfected: boolean;
    viruses?: string[];
  }

  export default class NodeClam {
    init(options: ClamScanOptions): Promise<NodeClam>;
    scanStream(buffer: Buffer): Promise<ScanResult>;
  }
}
