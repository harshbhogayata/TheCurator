import { useEffect, useState } from 'react';
import { Download, FileDown } from 'lucide-react';

import { AppShell } from '../components/AppShell';
import { useToast } from '../components/Toast';
import {
  listPrivacyExports,
  requestPrivacyExport,
  type PrivacyExportPayload,
} from '../../services/mobile-api';

export function DataExport() {
  const { success, error: showError } = useToast();
  const [exports, setExports] = useState<PrivacyExportPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchExports = async () => {
    try {
      const data = await listPrivacyExports();
      setExports(data);
    } catch {
      showError('Failed to load exports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExports();
  }, []);

  const handleRequestExport = async () => {
    setRequesting(true);
    try {
      await requestPrivacyExport();
      success('Export requested! Check back soon.');
      await fetchExports();
    } catch {
      showError('Failed to request export.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <AppShell title="Data Export">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6">
          <h2 className="font-[family-name:var(--font-headline)] text-xl text-on-surface">Download your data</h2>
          <p className="mt-2 text-on-surface-variant">
            Request a copy of your account data, saved articles, and reading history.
          </p>
          <button
            type="button"
            onClick={() => void handleRequestExport()}
            disabled={requesting}
            className="mt-4 flex items-center gap-2 rounded-full bg-inverse-surface px-6 py-3 text-sm text-inverse-on-surface hover:bg-primary disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {requesting ? 'Requesting…' : 'Request export'}
          </button>
        </div>

        <div>
          <h3 className="mb-4 font-medium text-on-surface">Export history</h3>
          {loading ? (
            <p className="text-outline">Loading…</p>
          ) : exports.length === 0 ? (
            <p className="text-on-surface-variant">No exports yet.</p>
          ) : (
            <div className="space-y-3">
              {exports.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[24px] border border-outline-variant/15 bg-surface-container-low p-4"
                >
                  <div>
                    <p className="capitalize text-on-surface">{item.status}</p>
                    <p className="text-xs text-outline">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  {item.status === 'completed' && item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      <FileDown className="h-4 w-4" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
