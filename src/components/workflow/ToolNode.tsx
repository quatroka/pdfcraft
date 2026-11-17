'use client';

import React, { memo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Handle, Position, useReactFlow } from 'reactflow';
import { ToolNodeData } from '@/types/workflow';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';

interface ToolNodeProps {
    id: string;
    data: ToolNodeData;
    selected?: boolean;
    isConnectable?: boolean;
}

/**
 * Socket color helper inspired by BentoPDF socket types
 */
function getSocketColor(format?: string | string[]): { bg: string; border: string; label: string } {
    const fmt = Array.isArray(format) ? format[0]?.toLowerCase() : format?.toLowerCase();
    if (!fmt || fmt === '*' || fmt === 'any') {
        return { bg: '#8b5cf6', border: '#7c3aed', label: 'Any Format' };
    }
    if (fmt.includes('pdf')) {
        return { bg: '#6366f1', border: '#4f46e5', label: 'PDF Document' };
    }
    if (fmt.includes('image') || fmt.includes('jpg') || fmt.includes('png') || fmt.includes('webp') || fmt.includes('svg')) {
        return { bg: '#10b981', border: '#059669', label: 'Image' };
    }
    if (fmt.includes('word') || fmt.includes('excel') || fmt.includes('ppt') || fmt.includes('office') || fmt.includes('docx') || fmt.includes('pptx') || fmt.includes('xlsx')) {
        return { bg: '#f59e0b', border: '#d97706', label: 'Office Document' };
    }
    if (fmt.includes('txt') || fmt.includes('json') || fmt.includes('markdown') || fmt.includes('text') || fmt.includes('csv')) {
        return { bg: '#06b6d4', border: '#0891b2', label: 'Text / Data' };
    }
    if (fmt.includes('zip') || fmt.includes('archive')) {
        return { bg: '#ec4899', border: '#db2777', label: 'ZIP Archive' };
    }
    return { bg: '#6366f1', border: '#4f46e5', label: fmt };
}

/**
 * Category badge styles
 */
const categoryBadgeStyles: Record<string, { bg: string; text: string; label: string }> = {
    'flow-control': { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', label: 'Flow Control' },
    'organize-manage': { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', label: 'Organize' },
    'edit-annotate': { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', label: 'Edit' },
    'convert-to-pdf': { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', label: 'Convert to PDF' },
    'convert-from-pdf': { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', label: 'Convert from PDF' },
    'optimize-repair': { bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', label: 'Optimize' },
    'secure-pdf': { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', label: 'Security' },
    'output': { bg: 'bg-pink-100 dark:bg-pink-950/60', text: 'text-pink-700 dark:text-pink-300', label: 'Output' },
};

/**
 * Extract an intuitive 1-line parameter summary for the node card
 */
function getNodeSettingsSummary(toolId: string, settings: Record<string, unknown> | undefined, locale: string): string | null {
    const pt = locale === 'pt';
    const tr = (pt ? {
        rotate: 'Rotação', medium: 'Qualidade média', standard: 'algoritmo padrão', split: 'Dividir por página', save: 'Salvar', archive: 'Arquivar', clockwise: 'sentido horário', imageWatermark: 'Marca d’água de imagem', tile: 'repetida', watermark: 'Marca d’água', low: 'Tamanho reduzido', high: 'Alta qualidade', excellent: 'Qualidade máxima', every: 'Dividir a cada', range: 'Intervalo', pageNumber: 'Numeração', starts: 'começando na página', topLeft: 'Superior esquerda', topCenter: 'Superior central', topRight: 'Superior direita', bottomLeft: 'Inferior esquerda', bottomCenter: 'Inferior central', bottomRight: 'Inferior direita', count: 'Quantidade de arquivos', size: 'Tamanho', format: 'Formato', pagesPerSheet: 'páginas por folha', page: 'Páginas', protect: 'Proteção por senha', secure: 'Protegido', flatten: 'Achatar formulários e anotações', contents: 'Sumário', header: 'Cabeçalho', footer: 'Rodapé', headerFooter: 'Cabeçalho e rodapé', background: 'Cor de fundo', textColor: 'Cor do texto', quality: 'Qualidade', color: 'Cor', inputType: 'Tipo de entrada', parameters: 'Parâmetros', download: 'Baixar arquivos de saída', generated: 'arquivo(s) gerado(s)', previewTitle: 'Visualizar rapidamente a saída desta etapa em uma nova guia', previewStep: 'Visualizar etapa', outputType: 'Tipo de saída'
    } : locale === 'en' ? {
        rotate: 'Rotate', medium: 'Medium quality', standard: 'standard algorithm', split: 'Split by page', save: 'Save', archive: 'Archive', clockwise: 'clockwise', imageWatermark: 'Image watermark', tile: 'tiled', watermark: 'Watermark', low: 'Low size', high: 'High quality', excellent: 'Excellent quality', every: 'Split every', range: 'Range', pageNumber: 'Page numbers', starts: 'starting at page', topLeft: 'Top left', topCenter: 'Top center', topRight: 'Top right', bottomLeft: 'Bottom left', bottomCenter: 'Bottom center', bottomRight: 'Bottom right', count: 'File count', size: 'Size', format: 'Format', pagesPerSheet: 'pages per sheet', page: 'Pages', protect: 'Password protected', secure: 'Secured', flatten: 'Flatten forms and annotations', contents: 'Contents', header: 'Header', footer: 'Footer', headerFooter: 'Header/footer', background: 'Background color', textColor: 'Text color', quality: 'Quality', color: 'Color', inputType: 'Input type', parameters: 'Parameters', download: 'Download output files', generated: 'generated file(s)', previewTitle: 'Quickly preview this step output in a new tab', previewStep: 'Preview step', outputType: 'Output type'
    } : {
        rotate: '旋转', medium: '中等质量', standard: '标准算法', split: '按单页拆分', save: '保存', archive: '归档', clockwise: '顺时针', imageWatermark: '图片水印', tile: '平铺', watermark: '水印', low: '低体积', high: '高质量', excellent: '极佳质量', every: '每', range: '范围', pageNumber: '页码', starts: '起', topLeft: '左上', topCenter: '顶部居中', topRight: '右上', bottomLeft: '左下', bottomCenter: '底部居中', bottomRight: '右下', count: '文件数', size: '大小', format: '格式', pagesPerSheet: '拼一版', page: '页码', protect: '设置密码保护', secure: '加密安全', flatten: '扁平化表单与注释', contents: '目录', header: '眉', footer: '脚', headerFooter: '页眉页脚', background: '背景色', textColor: '文字色', quality: '质量', color: '颜色', inputType: '输入类型', parameters: '参数', download: '立即下载产物', generated: '个生成文件', previewTitle: '在新标签页中快速预览当前步骤输出', previewStep: '预览步骤', outputType: '输出类型'
    });
    if (!settings || Object.keys(settings).length === 0) {
        if (toolId === 'rotate-pdf') return `${tr.rotate}: 90° ${tr.clockwise}`;
        if (toolId === 'compress-pdf') return `${tr.medium} (${tr.standard})`;
        if (toolId === 'split-pdf') return tr.split;
        if (toolId === 'download-pdf') return `${tr.save}: output.pdf`;
        if (toolId === 'download-zip') return `${tr.archive}: output.zip`;
        return null;
    }

    switch (toolId) {
        case 'rotate-pdf': {
            const angle = settings.angle ?? 90;
            return `${tr.rotate}: ${angle}°`;
        }
        case 'add-watermark': {
            const isImage = settings.watermarkType === 'image';
            const isRepeat = Boolean(settings.repeat);
            if (isImage) {
                return `${tr.imageWatermark}${isRepeat ? ` (${tr.tile})` : ''}`;
            }
            const text = String(settings.text || 'CONFIDENTIAL');
            return `${isRepeat ? `${tr.tile} ${tr.watermark}: ` : `${tr.watermark}: `}"${text}"`;
        }
        case 'compress-pdf': {
            const quality = String(settings.quality || 'medium');
            const qualityMap: Record<string, string> = { low: tr.low, medium: tr.medium, high: tr.high, maximum: tr.excellent };
            const algo = String(settings.algorithm || 'standard');
            return `${qualityMap[quality] || quality} (${algo})`;
        }
        case 'split-pdf': {
            const mode = String(settings.splitMode || 'every-page');
            if (mode === 'every-n-pages') {
                const pageCount = settings.pagesPerSplit || 1;
                return locale === 'zh' || locale === 'zh-TW'
                    ? `每 ${pageCount} 页拆分`
                    : `${tr.every} ${pageCount} ${pt ? 'páginas' : 'pages'}`;
            }
            if (mode === 'ranges' && settings.pageRanges) {
                return `${tr.range}: ${settings.pageRanges}`;
            }
            return tr.split;
        }
        case 'page-numbers': {
            const pos = String(settings.position || 'bottom-center');
            const posMap: Record<string, string> = {
                'top-left': tr.topLeft, 'top-center': tr.topCenter, 'top-right': tr.topRight,
                'bottom-left': tr.bottomLeft, 'bottom-center': tr.bottomCenter, 'bottom-right': tr.bottomRight
            };
            const startNumber = settings.startNumber || 1;
            const startLabel = locale === 'zh' || locale === 'zh-TW'
                ? `第${startNumber}页起`
                : `${tr.starts} ${startNumber}`;
            return `${tr.pageNumber}: ${posMap[pos] || pos} (${startLabel})`;
        }
        case 'download-pdf': {
            return `${tr.save}: ${settings.filename || 'output.pdf'}`;
        }
        case 'download-zip': {
            return `ZIP: ${settings.filename || 'output.zip'}`;
        }
        case 'djvu-to-pdf': {
            const dpi = settings.dpi || 150;
            return `DPI: ${dpi}`;
        }
        case 'condition-gateway': {
            const type = String(settings.conditionType || 'file-count');
            const op = String(settings.operator || 'greater-than');
            const opMap: Record<string, string> = {
                'greater-than': '>', 'less-than': '<', 'equals': '=',
                'not-equals': '!=', 'contains': pt ? 'contém' : 'contains', 'ends-with': pt ? 'termina com' : 'ends with'
            };
            const typeMap: Record<string, string> = {
                'file-count': tr.count, 'file-size': tr.size, 'file-format': tr.format
            };
            return `${typeMap[type] || type} ${opMap[op] || op} ${settings.value ?? 1}${type === 'file-size' ? (settings.sizeUnit || 'MB') : ''}`;
        }
        case 'n-up-pdf': {
            return `${settings.pagesPerSheet || 4} ${tr.pagesPerSheet} (${settings.pageSize || 'A4'})`;
        }
        case 'extract-pages':
        case 'delete-pages': {
            return `${tr.page}: ${settings.pageRange || '1'}`;
        }
        case 'ocr-pdf': {
            return `OCR: ${settings.language || settings.languages || 'eng'}`;
        }
        case 'encrypt-pdf': {
            return settings.userPassword ? tr.protect : tr.secure;
        }
        case 'flatten-pdf': {
            return tr.flatten;
        }
        case 'table-of-contents': {
            return `${tr.contents}: "${settings.title || 'Table of Contents'}"`;
        }
        case 'header-footer': {
            const parts = [];
            if (settings.headerText) parts.push(`${tr.header}: "${settings.headerText}"`);
            if (settings.footerText) parts.push(`${tr.footer}: "${settings.footerText}"`);
            return parts.join(' | ') || tr.headerFooter;
        }
        case 'background-color': {
            return `${tr.background}: ${settings.color || '#FFFFFF'}`;
        }
        case 'text-color': {
            return `${tr.textColor}: ${settings.color || '#000000'}`;
        }
        default: {
            if (settings.filename) return `${settings.filename}`;
            if (settings.quality) return `${tr.quality}: ${settings.quality}`;
            if (settings.color) return `${tr.color}: ${settings.color}`;
            return null;
        }
    }
}

/**
 * Custom Tool Node for ReactFlow
 * Displays a PDF tool as a draggable node in the workflow
 */
const ToolNode = memo(({ id, data, selected = false, isConnectable = true }: ToolNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { deleteElements } = useReactFlow();
    const locale = useLocale();
    const tWorkflow = useTranslations('workflow');

    // Get the icon component dynamically
    const iconName = toPascalCase(data.icon);
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
        || LucideIcons.FileText;

    // Handle delete node
    const handleDelete = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent node click from triggering
        deleteElements({ nodes: [{ id }] });
    };

    // Status colors
    const statusColors: Record<ToolNodeData['status'], string> = {
        idle: 'bg-[hsl(var(--color-muted))]',
        processing: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400',
        complete: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400',
        error: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-400',
        skipped: 'bg-gray-100/70 dark:bg-gray-800/40 border-dashed border-gray-300 dark:border-gray-600 opacity-60',
    };

    // Status indicator colors
    const statusIndicatorColors: Record<ToolNodeData['status'], string> = {
        idle: 'bg-gray-300 dark:bg-gray-600',
        processing: 'bg-blue-500 animate-ping',
        complete: 'bg-emerald-500',
        error: 'bg-rose-500',
        skipped: 'bg-gray-400',
    };

    // Category border-left accent
    const categoryBorders: Record<string, string> = {
        'flow-control': 'border-l-purple-500',
        'organize-manage': 'border-l-blue-500',
        'edit-annotate': 'border-l-indigo-500',
        'convert-to-pdf': 'border-l-emerald-500',
        'convert-from-pdf': 'border-l-amber-500',
        'optimize-repair': 'border-l-cyan-500',
        'secure-pdf': 'border-l-rose-500',
        'output': 'border-l-pink-500',
    };

    const badge = categoryBadgeStyles[data.category] || {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        label: data.category,
    };

    const inputSocket = getSocketColor(data.acceptedFormats);
    const outputSocket = getSocketColor(data.outputFormat);
    const settingsSummary = getNodeSettingsSummary(data.toolId, data.settings, locale);

    return (
        <div
            className={`
        relative px-3.5 py-3 rounded-xl shadow-md border-2 border-l-4 transition-all duration-200
        w-[240px]
        ${statusColors[data.status]}
        ${categoryBorders[data.category] || 'border-l-gray-400'}
        ${selected ? 'ring-2 ring-[hsl(var(--color-primary))] ring-offset-2' : ''}
        ${isHovered ? 'shadow-xl scale-[1.02]' : ''}
        ${data.status === 'processing' ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Delete Button - shown on hover */}
            {isHovered && (
                <button
                    onClick={handleDelete}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center shadow-md transition-colors z-10"
                    title={tWorkflow('deleteNode')}
                >
                    <X className="w-3 h-3 text-white" />
                </button>
            )}

            {/* Input Handle with format-aware semantic color and tooltip */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                style={{
                    backgroundColor: inputSocket.bg,
                    borderColor: '#ffffff',
                }}
                className="!w-3.5 !h-3.5 !border-2 shadow-sm transition-transform hover:scale-125"
                title={`${tWorkflow('inputType')}: ${inputSocket.label}`}
            />

            {/* Top Category Badge */}
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusIndicatorColors[data.status]}`} />
                    <span className="text-[11px] text-[hsl(var(--color-muted-foreground))] capitalize font-medium">
                        {data.status}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center gap-2.5">
                {/* Icon */}
                <div className={`
                    p-2 rounded-lg shrink-0 shadow-xs
                    ${data.status === 'processing' ? 'bg-blue-200 dark:bg-blue-900/60' : 'bg-white dark:bg-gray-800/80'}
                `}>
                    <IconComponent className="w-4 h-4 text-[hsl(var(--color-foreground))]" />
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--color-foreground))] truncate leading-tight">
                        {data.label}
                    </p>
                    {data.toolId && (
                        <p className="text-[10px] text-[hsl(var(--color-muted-foreground))] truncate mt-0.5 font-mono opacity-80">
                            {data.toolId}
                        </p>
                    )}
                </div>
            </div>

            {/* Inline Parameter Summary Badge */}
            {settingsSummary && (
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--color-muted)/0.7)] dark:bg-gray-800/60 border border-[hsl(var(--color-border)/0.6)] text-[11px] text-[hsl(var(--color-foreground))] font-medium truncate" title={`${tWorkflow('parameters')}: ${settingsSummary}`}>
                    <LucideIcons.Sliders className="w-3 h-3 text-[hsl(var(--color-primary))] shrink-0" />
                    <span className="truncate">{settingsSummary}</span>
                </div>
            )}

            {/* Progress bar */}
            {data.status === 'processing' && (
                <div className="mt-2.5 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${data.progress}%` }}
                    />
                </div>
            )}

            {/* Error message */}
            {data.status === 'error' && data.error && (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 truncate">
                    {data.error}
                </p>
            )}

            {/* Download Action Area for download-pdf & download-zip nodes */}
            {data.toolId && (data.toolId === 'download-pdf' || data.toolId === 'download-zip') && data.status === 'complete' && data.outputFiles && data.outputFiles.length > 0 && (
                <div className="mt-2.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            data.outputFiles?.forEach((file, index) => {
                                const blob = file instanceof Blob ? file : file.blob;
                                const originalName = file instanceof Blob ? undefined : file.filename;
                                const fallbackExt = data.toolId === 'download-zip' ? 'zip' : 'pdf';
                                const defaultName = originalName || (data.settings?.filename as string) || `workflow-output-${index + 1}.${fallbackExt}`;
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = defaultName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                setTimeout(() => URL.revokeObjectURL(url), 5000);
                            });
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                        <LucideIcons.Download className="w-3.5 h-3.5" />
                        <span>{tWorkflow('download')}</span>
                    </button>
                </div>
            )}

            {/* Output file count indicator & Quick Preview Button */}
            {data.status === 'complete' && data.outputFiles && data.outputFiles.length > 0 && (
                <div className="mt-2 flex items-center justify-between gap-1.5 pt-1 border-t border-[hsl(var(--color-border)/0.4)]">
                    <div className="flex items-center gap-1.5">
                        <LucideIcons.CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {tWorkflow('generatedFiles', { count: data.outputFiles.length })}
                        </span>
                    </div>
                    {/* Quick Preview Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const first = data.outputFiles?.[0];
                            if (first) {
                                const blob = first instanceof Blob ? first : first.blob;
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                setTimeout(() => URL.revokeObjectURL(url), 60000);
                            }
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
                        title={tWorkflow('quickPreviewStep')}
                    >
                        <LucideIcons.Eye className="w-3 h-3" />
                        <span>{tWorkflow('previewStep')}</span>
                    </button>
                </div>
            )}

            {/* Format tags with socket color dots */}
            <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-[hsl(var(--color-border)/0.5)]">
                <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--color-muted-foreground))] truncate max-w-[100px]" title={data.acceptedFormats.join(', ')}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: inputSocket.bg }} />
                    <span className="truncate">{data.acceptedFormats.slice(0, 1).join(', ') || '*'}</span>
                </div>
                <LucideIcons.ArrowRight className="w-2.5 h-2.5 text-[hsl(var(--color-muted-foreground))] shrink-0 opacity-50" />
                <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--color-muted-foreground))] truncate max-w-[90px]" title={data.outputFormat}>
                    <span className="truncate">{data.outputFormat || '*'}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: outputSocket.bg }} />
                </div>
            </div>

            {/* Output Handle with format-aware semantic color and tooltip */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{
                    backgroundColor: outputSocket.bg,
                    borderColor: '#ffffff',
                }}
                className="!w-3.5 !h-3.5 !border-2 shadow-sm transition-transform hover:scale-125"
                title={`${tWorkflow('outputType')}: ${outputSocket.label}`}
            />
        </div>
    );
});

ToolNode.displayName = 'ToolNode';

/**
 * Convert kebab-case to PascalCase for icon lookup
 */
function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

export default ToolNode;

