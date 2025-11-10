import { ArrowLeft, Edit3, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CoverPageSettings, CoverPageTemplateEntity } from '../../domain/entities/Project';
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';
import TinyMCEEditor from './TinyMCEEditor';

interface CoverPageTemplateDesignerProps {
  onBack?: () => void;
  onTemplatesChanged?: () => void;
}

type TemplateFormState = {
  name: string;
  description: string;
  content: string;
  settings: CoverPageSettings;
};

const DEFAULT_SETTINGS: CoverPageSettings = {
  showOrganization: true,
  organizationName: 'Equity Group Holdings PLC',
  showOrangeLine: true,
  showProjectName: true,
  logoText: 'EQUITY'
};

const getDefaultContent = () => `
  <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 80px 40px; background: linear-gradient(135deg, #111827, #1f2937); color: #ffffff;">
    <div style="width: 100%; max-width: 860px; text-align: center;">
      <p style="letter-spacing: 12px; font-size: 14px; color: #fbbf24; margin-bottom: 24px;">SOLUTION DESIGN</p>
      <h1 style="font-size: 52px; font-weight: 700; margin-bottom: 20px; color: #f9fafb;">Project Title</h1>
      <p style="font-size: 18px; color: #d1d5db; margin-bottom: 60px;">Craft a modern, branded cover page for your Solution Design Documents. Use templates to keep projects consistent and polished.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; text-align: left;">
        <div>
          <h3 style="font-size: 16px; text-transform: uppercase; letter-spacing: 6px; color: #fbbf24; margin-bottom: 8px;">VERSION</h3>
          <p style="font-size: 20px; font-weight: 600;">1.0</p>
        </div>
        <div>
          <h3 style="font-size: 16px; text-transform: uppercase; letter-spacing: 6px; color: #fbbf24; margin-bottom: 8px;">DATE</h3>
          <p style="font-size: 20px; font-weight: 600;">${new Date().toLocaleDateString()}</p>
        </div>
        <div>
          <h3 style="font-size: 16px; text-transform: uppercase; letter-spacing: 6px; color: #fbbf24; margin-bottom: 8px;">AUTHOR</h3>
          <p style="font-size: 20px; font-weight: 600;">Architecture Team</p>
        </div>
      </div>
    </div>
  </div>
`;

const SAMPLE_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  content: string;
  settings?: CoverPageSettings;
}> = [
  {
    id: 'signature-gradient',
    name: 'Signature Gradient',
    description: 'Rich gradient hero with glowing highlight and executive typography.',
    content: `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at top left, rgba(255, 102, 0, 0.35), transparent 55%), linear-gradient(160deg, #0f172a 0%, #111827 45%, #1f2937 100%); color: #f8fafc; padding: 96px 48px;">
        <div style="width: 100%; max-width: 880px; background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(226, 232, 240, 0.08); box-shadow: 0 40px 80px rgba(15, 23, 42, 0.45); border-radius: 28px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: 48px; padding: 64px 72px 56px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-size: 13px; letter-spacing: 8px; font-weight: 600; text-transform: uppercase; color: rgba(248, 250, 252, 0.72);">Equity Bank</span>
                <span style="display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; letter-spacing: 6px; color: rgba(248, 250, 252, 0.85);">
                  <span style="width: 40px; height: 2px; background: linear-gradient(90deg, #f97316, rgba(249, 115, 22, 0)); border-radius: 999px;"></span>
                  Solution Design Document
                </span>
              </div>
              <div style="padding: 12px 18px; border-radius: 20px; background: rgba(248, 250, 252, 0.08); font-size: 12px; letter-spacing: 4px; font-weight: 600;">CONFIDENTIAL</div>
            </div>

            <div>
              <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 10px; color: rgba(248, 250, 252, 0.6); margin-bottom: 18px;">Project</p>
              <h1 style="font-size: 56px; line-height: 1.1; font-weight: 700; margin: 0;">{{PROJECT_NAME}}</h1>
              <p style="margin-top: 20px; max-width: 560px; font-size: 18px; color: rgba(226, 232, 240, 0.8);">
                Transforming banking experiences through secure, resilient and intelligent architecture.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px;">
              <div>
                <span style="font-size: 12px; letter-spacing: 6px; color: rgba(248, 250, 252, 0.5);">VERSION</span>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: 600;">{{VERSION}}</p>
              </div>
              <div>
                <span style="font-size: 12px; letter-spacing: 6px; color: rgba(248, 250, 252, 0.5);">DATE</span>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: 600;">{{DATE}}</p>
              </div>
              <div>
                <span style="font-size: 12px; letter-spacing: 6px; color: rgba(248, 250, 252, 0.5);">AUTHOR</span>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: 600;">{{AUTHOR}}</p>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.18);">
              <p style="font-size: 12px; letter-spacing: 3px; color: rgba(226, 232, 240, 0.65);">{{ORGANIZATION}} — Architecture & Innovation Office</p>
              <p style="font-size: 12px; letter-spacing: 3px; color: rgba(226, 232, 240, 0.6);">STRICTLY CONFIDENTIAL</p>
            </div>
          </div>
        </div>
      </div>
    `,
    settings: {
      footerText: 'STRICTLY CONFIDENTIAL — ARCHITECTURE & INNOVATION OFFICE'
    }
  },
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: 'Clean white layout with golden accent bar and precise typography.',
    content: `
      <div style="min-height: 100vh; background: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 96px 48px; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #0f172a;">
        <div style="width: 100%; max-width: 920px; background: #ffffff; box-shadow: 0 35px 65px rgba(15, 23, 42, 0.12); border-radius: 24px; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) 280px;">
          <div style="padding: 64px 72px 56px;">
            <div style="margin-bottom: 36px;">
              <span style="display: inline-block; padding: 6px 18px; border-radius: 999px; background: rgba(15, 23, 42, 0.08); font-size: 12px; letter-spacing: 4px; font-weight: 600; text-transform: uppercase;">Solution Architecture</span>
              <h1 style="margin: 32px 0 12px; font-size: 50px; line-height: 1.08; font-weight: 700;">{{PROJECT_NAME}}</h1>
              <p style="font-size: 18px; line-height: 1.6; color: rgba(15, 23, 42, 0.65); max-width: 560px;">
                Designing resilient, scalable and compliant architecture to power the next generation of banking capabilities across channels.
              </p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
              <div>
                <span style="font-size: 12px; letter-spacing: 5px; color: rgba(15, 23, 42, 0.4);">VERSION</span>
                <p style="margin: 10px 0 0; font-size: 22px; font-weight: 600; color: #f97316;">{{VERSION}}</p>
              </div>
              <div>
                <span style="font-size: 12px; letter-spacing: 5px; color: rgba(15, 23, 42, 0.4);">DATE</span>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: 600;">{{DATE}}</p>
              </div>
              <div>
                <span style="font-size: 12px; letter-spacing: 5px; color: rgba(15, 23, 42, 0.4);">AUTHOR</span>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: 600;">{{AUTHOR}}</p>
              </div>
            </div>
          </div>
          <div style="background: linear-gradient(180deg, #f97316 0%, #f59e0b 100%); padding: 64px 32px; display: flex; flex-direction: column; justify-content: space-between; color: #fff3e6;">
            <div>
              <span style="display: inline-block; font-size: 13px; letter-spacing: 6px; font-weight: 600; text-transform: uppercase; color: rgba(255, 255, 255, 0.65);">Prepared For</span>
              <p style="margin: 18px 0 0; font-size: 22px; font-weight: 600; color: #ffffff;">{{ORGANIZATION}}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Digital Architecture & Innovation</p>
              <hr style="border: none; height: 1px; margin: 16px 0; background: rgba(255, 255, 255, 0.3);" />
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: rgba(255, 255, 255, 0.75);">
                This document contains proprietary information belonging to Equity Group Holdings. Unauthorized use or distribution is strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
    settings: {
      footerText: 'Proprietary & Confidential — Equity Group Holdings'
    }
  },
  {
    id: 'vertical-flare',
    name: 'Vertical Flare',
    description: 'Bold vertical accent with layered panels and glowing key figures.',
    content: `
      <div style="min-height: 100vh; background: #0b1220; display: flex; align-items: center; justify-content: center; padding: 90px 48px; color: #e2e8f0;">
        <div style="width: 100%; max-width: 900px; position: relative;">
          <div style="position: absolute; inset: 0; background: radial-gradient(circle at 15% 20%, rgba(249, 115, 22, 0.45), transparent 55%); filter: blur(18px);"></div>
          <div style="position: relative; display: grid; grid-template-columns: 230px minmax(0, 1fr); background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(18px); border: 1px solid rgba(148, 163, 184, 0.28); border-radius: 24px; overflow: hidden; box-shadow: 0 40px 80px rgba(8, 15, 30, 0.55);">
            <div style="background: linear-gradient(200deg, #f97316 0%, #fb923c 55%, rgba(249, 115, 22, 0.4) 100%); padding: 48px 32px; display: flex; flex-direction: column; gap: 32px;">
              <div>
                <p style="font-size: 12px; letter-spacing: 6px; text-transform: uppercase; color: rgba(17, 24, 39, 0.55);">Document</p>
                <h2 style="margin: 12px 0 0; font-size: 26px; line-height: 1.25; font-weight: 700; color: #111827;">Solution Design<br/>Document</h2>
              </div>
              <div>
                <p style="font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: rgba(17, 24, 39, 0.55);">Prepared For</p>
                <p style="margin: 10px 0 0; font-size: 17px; font-weight: 600; color: #0b1220;">{{ORGANIZATION}}</p>
              </div>
              <div style="margin-top: auto;">
                <p style="margin: 0; font-size: 11px; letter-spacing: 3px; color: rgba(17, 24, 39, 0.55);">Confidential</p>
              </div>
            </div>
            <div style="padding: 56px 64px; display: flex; flex-direction: column; gap: 32px;">
              <div>
                <span style="font-size: 12px; letter-spacing: 8px; color: rgba(226, 232, 240, 0.55); text-transform: uppercase;">Project</span>
                <h1 style="margin: 18px 0 0; font-size: 54px; line-height: 1.05; font-weight: 700;">{{PROJECT_NAME}}</h1>
              </div>
              <p style="font-size: 18px; line-height: 1.6; color: rgba(226, 232, 240, 0.7);">
                Envisioning a unified digital banking experience through cloud-first, API-led integration and adaptive security architecture.
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
                <div style="background: rgba(148, 163, 184, 0.12); border-radius: 16px; padding: 18px 20px;">
                  <span style="font-size: 11px; letter-spacing: 4px; color: rgba(226, 232, 240, 0.55);">VERSION</span>
                  <p style="margin: 12px 0 0; font-size: 24px; font-weight: 600; color: #f97316;">{{VERSION}}</p>
                </div>
                <div style="background: rgba(148, 163, 184, 0.12); border-radius: 16px; padding: 18px 20px;">
                  <span style="font-size: 11px; letter-spacing: 4px; color: rgba(226, 232, 240, 0.55);">DATE</span>
                  <p style="margin: 12px 0 0; font-size: 20px; font-weight: 600;">{{DATE}}</p>
                </div>
                <div style="background: rgba(148, 163, 184, 0.12); border-radius: 16px; padding: 18px 20px;">
                  <span style="font-size: 11px; letter-spacing: 4px; color: rgba(226, 232, 240, 0.55);">AUTHOR</span>
                  <p style="margin: 12px 0 0; font-size: 20px; font-weight: 600;">{{AUTHOR}}</p>
                </div>
              </div>
              <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; color: rgba(226, 232, 240, 0.6); font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">
                <span>Architecture & Innovation Office</span>
                <span>STRICTLY PRIVATE & CONFIDENTIAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    settings: {
      footerText: 'Strictly Private & Confidential'
    }
  }
];

function buildFormState(template: CoverPageTemplateEntity | null): TemplateFormState {
  return {
    name: template?.name ?? '',
    description: template?.description ?? '',
    content: template?.content ?? getDefaultContent(),
    settings: {
      ...DEFAULT_SETTINGS,
      ...(template?.coverPageSettings || {})
    }
  };
}

const CoverPageTemplateDesigner: React.FC<CoverPageTemplateDesignerProps> = ({ onBack, onTemplatesChanged }) => {
  const repo = useMemo(() => new PrismaProjectRepository(), []);
  const [templates, setTemplates] = useState<CoverPageTemplateEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<CoverPageTemplateEntity | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(() => buildFormState(null));
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const editingTemplateIdRef = useRef<string | null>(null);

  useEffect(() => {
    editingTemplateIdRef.current = editingTemplate?.id ?? null;
  }, [editingTemplate?.id]);

  const loadTemplates = useCallback(async (focusTemplateId?: string) => {
    setLoading(true);
    try {
      const tpl = await repo.getCoverPageTemplates();
      setTemplates(tpl);

      if (tpl.length === 0) {
        setEditingTemplate(null);
        setFormState(buildFormState(null));
        return;
      }

      let nextTemplate: CoverPageTemplateEntity | null = null;

      const preferredId = focusTemplateId ?? editingTemplateIdRef.current ?? undefined;
      if (preferredId) {
        nextTemplate = tpl.find(t => t.id === preferredId) || null;
      }

      if (!nextTemplate) {
        nextTemplate = tpl[0];
      }

      setEditingTemplate(nextTemplate);
      setFormState(buildFormState(nextTemplate));
    } catch (err) {
      console.error('Failed to load cover page templates:', err);
      setError('Failed to load cover page templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const startCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormState(buildFormState(null));
    setError(null);
  }, []);

  const startEdit = useCallback((template: CoverPageTemplateEntity) => {
    setEditingTemplate(template);
    setFormState(buildFormState(template));
    setError(null);
  }, []);

  const handleApplySample = useCallback((sample: typeof SAMPLE_TEMPLATES[number]) => {
    setEditingTemplate(null);
    setFormState({
      name: sample.name,
      description: sample.description,
      content: sample.content,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(sample.settings || {})
      }
    });
    setError(null);
  }, []);

  const handleInputChange = (key: keyof TemplateFormState, value: string | CoverPageSettings) => {
    setFormState(prev => ({
      ...prev,
      [key]: value
    } as TemplateFormState));
  };

  const handleSettingChange = <K extends keyof CoverPageSettings>(key: K, value: CoverPageSettings[K]) => {
    setFormState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const handleSave = useCallback(async () => {
    setError(null);
    if (!formState.name.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!formState.content || !formState.content.trim()) {
      setError('Template content cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim() ? formState.description.trim() : undefined,
        content: formState.content,
        coverPageSettings: formState.settings,
        previewImage: undefined
      };

      let saved: CoverPageTemplateEntity;
      if (editingTemplate) {
        saved = await repo.updateCoverPageTemplate(editingTemplate.id, payload);
      } else {
        saved = await repo.createCoverPageTemplate(payload);
      }

      await loadTemplates(saved.id);
      onTemplatesChanged?.();
    } catch (err) {
      console.error('Failed to save cover page template:', err);
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editingTemplate, formState, loadTemplates, onTemplatesChanged, repo]);

  const handleDelete = useCallback(async (template: CoverPageTemplateEntity) => {
    if (!window.confirm(`Delete cover page template "${template.name}"?`)) {
      return;
    }
    try {
      await repo.deleteCoverPageTemplate(template.id);
      const focusId = editingTemplate && editingTemplate.id !== template.id ? editingTemplate.id : undefined;
      await loadTemplates(focusId);
      onTemplatesChanged?.();
    } catch (err) {
      console.error('Failed to delete cover page template:', err);
      setError('Failed to delete template. Please try again.');
    }
  }, [editingTemplate, loadTemplates, onTemplatesChanged, repo]);

  const selectedTemplateId = editingTemplate ? editingTemplate.id : 'new-template';

  const handleEditorImageUpload = useCallback(async (file: File): Promise<string> => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleGenerateWithAI = useCallback(async () => {
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt) {
      setError('Please describe the cover page style you want the AI to create.');
      return;
    }

    setAiGenerating(true);
    setError(null);
    try {
      const adapter = new ClaudeApiAdapter();
      const html = await adapter.generateCoverPageTemplate(trimmedPrompt);
      setEditingTemplate(null);
      setFormState((prev) => ({
        name: prev.name?.trim() ? prev.name : 'AI Generated Cover',
        description: prev.description,
        content: html,
        settings: prev.settings
      }));
    } catch (err: any) {
      console.error('Failed to generate cover page via AI:', err);
      setError(err?.message || 'Failed to generate cover page template. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cover Page Designer</h2>
            <p className="text-sm text-gray-500">Create and manage reusable cover page templates for your Solution Design Documents.</p>
          </div>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Templates</h3>
              <span className="text-xs text-gray-400">{loading ? 'Loading…' : `${templates.length} saved`}</span>
            </div>
            <div className="max-h-[540px] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Loading templates…</div>
              ) : templates.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No cover page templates yet. Create one to get started.
                </div>
              ) : (
                templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-4 transition-colors cursor-pointer ${
                      selectedTemplateId === template.id
                        ? 'bg-purple-50/80 border-l-4 border-purple-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => startEdit(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-gray-800">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-400">Updated {template.updatedAt.toLocaleString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(template);
                          }}
                          className="p-1.5 rounded-full text-purple-600 hover:bg-purple-100"
                          title="Edit template"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template);
                          }}
                          className="p-1.5 rounded-full text-red-600 hover:bg-red-100"
                          title="Delete template"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingTemplate ? 'Edit Cover Page Template' : 'Create Cover Page Template'}
                </h3>
                <p className="text-sm text-gray-500">
                  Configure branding options and craft the HTML content for your reusable cover page.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{saving ? 'Saving…' : 'Save Template'}</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Executive Cover"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Version</label>
                  <input
                    type="text"
                    value={formState.settings.version ?? ''}
                    onChange={(e) => handleSettingChange('version', e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder="What makes this cover page unique?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Date Label</label>
                  <input
                    type="text"
                    value={formState.settings.date ?? ''}
                    onChange={(e) => handleSettingChange('date', e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Leave blank to use current date"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Organization Text</label>
                  <input
                    type="text"
                    value={formState.settings.organizationName ?? ''}
                    onChange={(e) => handleSettingChange('organizationName', e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Equity Group Holdings PLC"
                    disabled={!formState.settings.showOrganization}
                  />
                  <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formState.settings.showOrganization ?? true}
                      onChange={(e) => handleSettingChange('showOrganization', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Display organization name on cover page</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Footer Text</label>
                  <input
                    type="text"
                    value={formState.settings.footerText ?? ''}
                    onChange={(e) => handleSettingChange('footerText', e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="CONFIDENTIAL | INTERNAL USE ONLY"
                  />
                  <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formState.settings.showProjectName ?? true}
                      onChange={(e) => handleSettingChange('showProjectName', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Show project name automatically</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Logo Text</label>
                  <input
                    type="text"
                    value={formState.settings.logoText ?? ''}
                    onChange={(e) => handleSettingChange('logoText', e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="EQUITY"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formState.settings.showOrangeLine ?? true}
                      onChange={(e) => handleSettingChange('showOrangeLine', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Show vertical accent line</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Template HTML *</label>
                <TinyMCEEditor
                  value={formState.content}
                  onChange={(content) => handleInputChange('content', content)}
                  height={420}
                  placeholder="Design the HTML layout for your cover page..."
                onImageUpload={handleEditorImageUpload}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sample Templates</h3>
                <p className="text-xs text-gray-500">Start from a curated Equity Bank look and refine it to match your project.</p>
              </div>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2">
              {SAMPLE_TEMPLATES.map((sample) => (
                <div key={sample.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-800">{sample.name}</h4>
                      <p className="text-xs text-gray-500">{sample.description}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <div
                        className="h-40 overflow-hidden text-[10px] leading-tight"
                        style={{ backgroundColor: '#ffffff' }}
                        dangerouslySetInnerHTML={{ __html: sample.content }}
                      />
                    </div>
                    <button
                      onClick={() => handleApplySample(sample)}
                      className="inline-flex items-center justify-center w-full space-x-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <Sparkles size={16} />
                      <span>Use this Style</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">AI Cover Page Generator</h3>
              <p className="text-xs text-gray-500">Describe the tone, layout, colours or inspiration and let Claude draft the HTML.</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., A cover with a dark navy hero, golden accent bar, subtle geometric pattern and space for executive summary"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Powered by Claude · Inline styles only</span>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Sparkles size={16} />
                  <span>{aiGenerating ? 'Crafting…' : 'Generate with AI'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Live Preview</h3>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div
                  className="min-h-[320px]"
                  dangerouslySetInnerHTML={{ __html: formState.content }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPageTemplateDesigner;


