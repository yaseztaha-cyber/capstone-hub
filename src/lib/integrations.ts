export type IntegrationId = 'github' | 'figma' | 'drive';

export interface Integration {
  id: IntegrationId;
  name: string;
  connected: boolean;
  url?: string;
  lastSync?: string;
}

export const STORAGE_KEY = 'sch_integrations';

export function getGithubUrl(repoUrl: string): string {
  return repoUrl.trim();
}

export function getFigmaEmbedUrl(figmaUrl: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl.trim())}`;
}

export function getDrivePickerUrl(): string {
  return 'https://drive.google.com/drive/my-drive';
}

export const defaultIntegrations: Integration[] = [
  { id: 'github', name: 'GitHub', connected: false },
  { id: 'figma', name: 'Figma', connected: false },
  { id: 'drive', name: 'Google Drive', connected: false },
];

export function loadIntegrations(): Integration[] {
  if (typeof window === 'undefined') return defaultIntegrations;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultIntegrations;
    const parsed = JSON.parse(raw) as Integration[];
    if (!Array.isArray(parsed)) return defaultIntegrations;
    return parsed;
  } catch {
    return defaultIntegrations;
  }
}

export function saveIntegrations(integrations: Integration[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
  } catch {}
}
