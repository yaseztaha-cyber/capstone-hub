'use client';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Keyboard, HelpCircle, Command, Search } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_ROWS: { keys: string[]; action: string; extra?: string }[] = [
  { keys: ['n'], action: 'New task' },
  { keys: ['m'], action: 'New meeting' },
  { keys: ['/'], action: 'Search', extra: '⌘K' },
  { keys: ['?'], action: 'Show help' },
  { keys: ['g', 'd'], action: 'Go Dashboard' },
  { keys: ['g', 't'], action: 'Go Tasks' },
  { keys: ['g', 'c'], action: 'Go Calendar' },
  { keys: ['g', 'f'], action: 'Go Files' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 bg-gray-100 border border-gray-300 border-b-2 rounded text-xs font-mono font-medium text-gray-700 shadow-sm">
      {children}
    </kbd>
  );
}

export default function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Keyboard size={16} className="text-gray-400" />
          <span>
            Press <Kbd>?</Kbd> anytime to open this help
          </span>
          <Badge variant="info" size="sm" className="ml-auto">
            <HelpCircle size={10} className="mr-1" /> Help
          </Badge>
        </div>

        <Card padding={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 w-1/2">
                  <span className="flex items-center gap-1.5">
                    <Command size={14} className="text-gray-400" /> Shortcut
                  </span>
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-gray-400" /> Action
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SHORTCUT_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1 flex-wrap">
                      {row.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < row.keys.length - 1 && <span className="text-gray-300 text-xs mx-0.5">then</span>}
                        </span>
                      ))}
                      {row.extra && (
                        <span className="text-xs text-gray-400 ml-1">({row.extra})</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
          <Search size={12} className="text-gray-400" />
          <span>
            <Kbd>/</Kbd> opens search &middot; <Kbd>⌘</Kbd> + <Kbd>K</Kbd> also opens search &middot; <Kbd>Esc</Kbd> closes dialogs
          </span>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Shortcuts are disabled while typing in inputs or editors.
        </p>
      </div>
    </Modal>
  );
}
