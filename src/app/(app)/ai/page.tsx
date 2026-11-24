'use client';

import { useState } from 'react';
import AIAssistant from '@/components/ai/AIAssistant';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Sparkles, Lightbulb, FileText, MessageSquare, Wand2 } from 'lucide-react';

export default function AIPage() {
  const { project } = useAppStore();
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [activeKey, setActiveKey] = useState(0);

  const quickPrompts = [
    {
      id: 'improve-problem',
      title: 'Improve my problem statement',
      description: 'Refine your problem statement for clarity and academic tone',
      icon: FileText,
      prompt: project?.problemStatement || 'Improve my problem statement about: ' + (project?.title || 'my STEM capstone project'),
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      id: 'research-summary',
      title: 'Generate research summary',
      description: 'Create a concise summary of your research findings',
      icon: Sparkles,
      prompt: project?.scientificPrinciples || 'Generate a research summary for my project on ' + (project?.title || 'my STEM topic'),
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300',
    },
    {
      id: 'conclusion',
      title: 'Help with conclusion',
      description: 'Draft a strong conclusion for your capstone',
      icon: MessageSquare,
      prompt: project?.conclusion || 'Help me write a conclusion for a STEM capstone project about ' + (project?.title || 'my topic') + '. My results show: ' + (project?.resultsAnalysis || 'promising results'),
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      id: 'brainstorm',
      title: 'Brainstorm ideas',
      description: 'Generate creative ideas and approaches',
      icon: Lightbulb,
      prompt: 'Brainstorm innovative ideas for a STEM capstone project about ' + (project?.title || 'sustainable engineering solutions') + '. Focus on practical, testable solutions.',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setActivePrompt(prompt);
    setActiveKey((k) => k + 1);
    // Scroll to assistant
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInsert = (text: string) => {
    // For now, copy to clipboard and optionally show feedback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles size={22} className="text-teal-600" />
          AI Writing Assistant - Free
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Powered by OpenRouter free models</p>
        {project?.title && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Project: <span className="font-medium">{project.title}</span>
          </p>
        )}
      </div>

      <AIAssistant key={activeKey} initialText={activePrompt} onInsert={handleInsert} />

      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Wand2 size={16} className="text-teal-600" />
          Quick Prompts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickPrompts.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all group"
                padding={true}
              >
                <button
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="w-full text-left flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300 group-hover:underline">Try it →</span>
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
