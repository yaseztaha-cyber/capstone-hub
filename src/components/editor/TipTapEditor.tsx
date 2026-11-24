'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import { common, createLowlight } from 'lowlight';
import { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { Bold, Italic, Underline as UnderlineIcon, Code, Code2, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Link2, Image as ImageIcon, Minus, CheckSquare, AlignLeft, AlignCenter, AlignRight, Highlighter, Type, Palette, Undo, Redo, Table as TableIcon, Sparkles, Loader2 } from 'lucide-react';
import { callAI } from '@/lib/ai';
import { useAppStore } from '@/lib/store';

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  collaborative?: boolean;
  sectionId?: string;
  projectId?: string;
  userId?: string;
  userName?: string;
  userColor?: string;
}

const editorExtensions: Extension[] = [
  StarterKit,
];

const ToolbarButton = ({ onClick, disabled, children, title, active }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; title: string; active?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded-lg transition-all duration-150 flex items-center justify-center',
      'text-white/70 hover:text-white hover:bg-white/10',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      active && 'bg-white/20 text-white'
    )}
  >
    {children}
  </button>
);

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1 px-2 border-r border-white/10">{children}</div>
);

export default function TipTapEditor({ 
  content, 
  onChange, 
  placeholder, 
  editable = true, 
  className, 
  collaborative = false,
  sectionId,
  projectId,
  userId,
}: TipTapEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const { project } = useAppStore();

  const persistenceRef = useRef<IndexeddbPersistence | null>(null);

  // Initialize Yjs doc
  const ydoc = useRef<Y.Doc>(new Y.Doc()).current;

  // Local-only persistence. There is deliberately no remote sync server:
  // drafts stay in this browser's IndexedDB and are never sent to a
  // third-party demo server.
  useEffect(() => {
    if (!collaborative || !sectionId || !projectId || !userId) return;

    const persistence = new IndexeddbPersistence(`project-${projectId}-section-${sectionId}`, ydoc);
    persistenceRef.current = persistence;

    return () => {
      persistenceRef.current?.destroy();
    };
  }, [collaborative, sectionId, projectId, userId, ydoc]);

  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        spellCheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addTaskList = useCallback(() => {
    editor.chain().focus().toggleTaskList().run();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addCodeBlock = useCallback(() => {
    editor.chain().focus().setCodeBlock().run();
  }, [editor]);

  const handleAIImprove = useCallback(async () => {
    if (!editor) return;
    // Get selected text; if an image is selected, show error
    const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    // Check if selection contains an image marker (Tiptap image nodes contain src)
    const selectionHtml = editor.getHTML();
    const hasImageInSelection = selectionHtml.includes('src=') || selectedText.includes('http') || selectedText.toLowerCase().includes('.png') || selectedText.toLowerCase().includes('.jpg') || selectedText.toLowerCase().includes('.jpeg');
    if (hasImageInSelection) {
      setError('AI Improve does not support images. Please select text only, or remove the image before using AI.');
      setAiLoading(false);
      return;
    }
    const textToImprove = selectedText.trim() ? selectedText : editor.getText();
    if (!textToImprove.trim()) return;
    setAiLoading(true);
    try {
      const result = await callAI(textToImprove, 'improve');
      if (result) {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          editor.chain().focus().deleteSelection().insertContent(result).run();
        } else {
          if (editor.getText().trim().length > 0 && selectedText.trim() === '') {
            editor.chain().focus().selectAll().insertContent(result).run();
          } else {
            editor.chain().focus().insertContent(result).run();
          }
        }
      }
    } catch (err) {
      console.error('AI Improve failed:', err);
      const message = err instanceof Error ? err.message : 'AI improve failed. Please try again.';
      // Handle the specific "Cannot read image.png" error from model
      if (message.toLowerCase().includes('cannot read') && message.toLowerCase().includes('.png')) {
        setError('This AI model does not support images. Please select text only, or remove the image before using AI.');
      } else if (message.toLowerCase().includes('does not support image')) {
        setError('This AI model does not support images. Please provide text only.');
      } else {
        setError(message);
      }
    } finally {
      setAiLoading(false);
    }
  }, [editor]);

  // Sync with Yjs when collaborative
  useEffect(() => {
    if (!collaborative || !editor || !sectionId) return;

    const yText = ydoc.getText(`section-${sectionId}`);
    
    // Initial sync from Yjs to TipTap
    editor.commands.setContent(yText.toString() || content);

    // Sync TipTap -> Yjs
    const handleUpdate = () => {
      ydoc.transact(() => {
        yText.delete(0, yText.length);
        yText.insert(0, editor.getText());
      });
    };

    editor.on('update', handleUpdate);

    // Yjs -> TipTap
    const yTextObserver = (event: Y.YTextEvent) => {
      editor.commands.setContent(yText.toString() || '');
    };
    yText.observe(yTextObserver);

    return () => {
      editor.off('update', handleUpdate);
      yText.unobserve(yTextObserver);
    };
  }, [editor, collaborative, sectionId]);

  if (!editor) return null;

  return (
    <div className={cn('bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden max-w-full', className)}>
      {editable && (
        <div className="border-b border-white/10 bg-white/5">
          {collaborative && (
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-b border-white/10">
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                Saved locally in this browser
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 overflow-x-auto">
            <ToolbarGroup>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span style={{ textDecoration: 'line-through' }}>S</span></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={16} /></ToolbarButton>
              <ToolbarButton onClick={addCodeBlock} title="Code Block"><Code2 size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16} /></ToolbarButton>
              <ToolbarButton onClick={addTaskList} active={editor.isActive('taskList')} title="Task List"><CheckSquare size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link"><Link2 size={16} /></ToolbarButton>
              <ToolbarButton onClick={addImage} title="Add Image"><ImageIcon size={16} /></ToolbarButton>
              <ToolbarButton onClick={addTable} title="Insert Table"><TableIcon size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={16} /></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={16} /></ToolbarButton>
            </ToolbarGroup>

            <ToolbarGroup>
              <button
                type="button"
                onClick={handleAIImprove}
                disabled={aiLoading || !editor.getText().trim()}
                title="AI Improve"
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  'bg-teal-600 text-white hover:bg-teal-700',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500'
                )}
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                ✨ AI Improve
              </button>
            </ToolbarGroup>
          </div>
        </div>
      )}

      <EditorContent editor={editor} className="p-4" />

      {editable && (
        <div className="px-4 py-2 text-xs text-white/30 border-t border-white/10">
          Word count: {editor.storage.characterCount?.words() || 0} • Characters: {editor.storage.characterCount?.characters() || 0}
        </div>
      )}
    </div>
  );
}
