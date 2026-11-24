'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useTranslations } from '@/lib/useTranslations';
import { getGithubUrl, getFigmaEmbedUrl, defaultIntegrations, STORAGE_KEY, type Integration } from '@/lib/integrations';
import { GitBranch, Palette, HardDrive, Plug, ExternalLink, Link2 } from 'lucide-react';

export default function IntegrationsPage() {
  const { t } = useTranslations();
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);
  const [githubInput, setGithubInput] = useState('');
  const [figmaInput, setFigmaInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Integration[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIntegrations(parsed);
          const gh = parsed.find((i) => i.id === 'github');
          const fg = parsed.find((i) => i.id === 'figma');
          if (gh?.url) setGithubInput(gh.url);
          if (fg?.url) setFigmaInput(fg.url);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
    } catch {}
  }, [integrations, mounted]);

  const getIntegration = (id: Integration['id']) => integrations.find((i) => i.id === id);

  const github = getIntegration('github');
  const figma = getIntegration('figma');

  const handleGithubConnect = () => {
    const url = githubInput.trim();
    if (!url) return;
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === 'github' ? { ...i, connected: true, url: getGithubUrl(url), lastSync: new Date().toISOString() } : i
      )
    );
  };

  const handleGithubDisconnect = () => {
    setIntegrations((prev) => prev.map((i) => (i.id === 'github' ? { ...i, connected: false, lastSync: undefined } : i)));
  };

  const handleFigmaConnect = () => {
    const url = figmaInput.trim();
    if (!url) return;
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === 'figma' ? { ...i, connected: true, url, lastSync: new Date().toISOString() } : i
      )
    );
  };

  const handleFigmaDisconnect = () => {
    setIntegrations((prev) => prev.map((i) => (i.id === 'figma' ? { ...i, connected: false, lastSync: undefined } : i)));
  };

  if (!mounted) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Integrations Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your favorite tools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Plug size={20} className="text-teal-700" />
          {t('integrations')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('integrationsDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* GitHub Card */}
        <Card className="flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <GitBranch size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
                <p className="text-xs text-gray-500">{t('githubDesc')}</p>
              </div>
            </div>
            <Badge variant={github?.connected ? 'success' : 'default'}>
              {github?.connected ? t('connected') : t('disconnected')}
            </Badge>
          </div>

          <div className="space-y-3 flex-1">
            <Input
              placeholder="https://github.com/user/repo"
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              disabled={!!github?.connected}
            />

            {github?.connected && github?.url ? (
              <a
                href={getGithubUrl(github.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 dark:text-teal-400 break-all"
              >
                <ExternalLink size={14} className="shrink-0" />
                {getGithubUrl(github.url)}
              </a>
            ) : null}

            <div>
              {github?.connected ? (
                <Button variant="outline" size="sm" className="w-full" onClick={handleGithubDisconnect}>
                  {t('disconnect')}
                </Button>
              ) : (
                <Button size="sm" className="w-full" onClick={handleGithubConnect} disabled={!githubInput.trim()}>
                  {t('connect')}
                </Button>
              )}
            </div>

            {github?.connected && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Repository linked. Commit-history sync isn&apos;t connected — open the repo on GitHub to browse commits.
                </p>
                {github.lastSync && (
                  <p className="text-[11px] text-gray-400">Linked: {new Date(github.lastSync).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Figma Card */}
        <Card className="flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Palette size={20} className="text-purple-700 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Figma</h3>
                <p className="text-xs text-gray-500">{t('figmaDesc')}</p>
              </div>
            </div>
            <Badge variant={figma?.connected ? 'success' : 'default'}>
              {figma?.connected ? t('connected') : t('disconnected')}
            </Badge>
          </div>

          <div className="space-y-3 flex-1">
            <Input
              placeholder="https://www.figma.com/file/..."
              value={figmaInput}
              onChange={(e) => setFigmaInput(e.target.value)}
              disabled={!!figma?.connected}
            />

            {figma?.connected && figma?.url ? (
              <a
                href={figma.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 dark:text-teal-400 break-all"
              >
                <Link2 size={14} className="shrink-0" />
                Open in Figma <ExternalLink size={12} />
              </a>
            ) : null}

            <div>
              {figma?.connected ? (
                <Button variant="outline" size="sm" className="w-full" onClick={handleFigmaDisconnect}>
                  {t('disconnect')}
                </Button>
              ) : (
                <Button size="sm" className="w-full" onClick={handleFigmaConnect} disabled={!figmaInput.trim()}>
                  {t('connect')}
                </Button>
              )}
            </div>

            {figma?.connected && figma?.url && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Embed preview</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <iframe
                    title="Figma embed preview"
                    src={getFigmaEmbedUrl(figma.url)}
                    className="w-full h-[300px] border-0"
                    allowFullScreen
                  />
                </div>
                {figma.lastSync && (
                  <p className="text-[11px] text-gray-400">Last sync: {new Date(figma.lastSync).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Google Drive Card */}
        <Card className="flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <HardDrive size={20} className="text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Google Drive</h3>
                <p className="text-xs text-gray-500">{t('driveDesc')}</p>
              </div>
            </div>
            <Badge variant="default">Not configured</Badge>
          </div>

          <div className="space-y-3 flex-1">
            <p className="text-xs text-gray-500">
              Google Drive isn&apos;t connected — there is no Drive OAuth configured, so file listing is unavailable.
              Upload project files directly from the Files page instead.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
