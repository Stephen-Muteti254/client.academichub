export interface AttachedFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  url?: string;
}

export interface PreferredWriter {
  id: string;
  name: string;
}