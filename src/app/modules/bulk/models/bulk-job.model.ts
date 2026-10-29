export type BulkJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'DONE'
  | 'PARTIAL'
  | 'FAILED';

export type BulkJobOperation =
  | 'IMPORT_JSON'
  | 'IMPORT_CSV'
  | 'EXPORT_CSV'
  | 'EXPORT_XLSX';

export type BulkJobMode = 'INSERT_ONLY' | 'UPSERT';

export interface BulkJob {
  id: string;
  entity: string;
  operation: BulkJobOperation;
  mode: BulkJobMode;
  status: BulkJobStatus;
  totalItems: number;
  processedItems: number;
  successItems: number;
  errorItems: number;
  progressPercent: number;
  remainingSeconds: number | null;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorSummary: string;
}

export interface CreateImportJobPayload {
  mode: BulkJobMode;
  data: Record<string, any>[];
}


export interface CreateImportJobResponse {
  jobId: string;
  status: BulkJobStatus;
  totalItems: number;
  message: string;
}

export interface OperationsFilter {
  operationType?: 'IMPORT' | 'EXPORT' | 'ALL';
  status?: BulkJobStatus;
  entity?: string;
}

export interface RowErrorDetail {
  lineNumber: number;
  rowData: Record<string, string>;
  originalRow: string;
  errorMessages: string[];
  errorCode: string;
}