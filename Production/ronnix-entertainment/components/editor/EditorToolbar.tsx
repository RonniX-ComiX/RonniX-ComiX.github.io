/**
 * editor/EditorToolbar.tsx — Formatierungsleiste des RichTextEditors.
 *
 * Feature: Undo/Redo, Bold/Italic/Underline/Strike, FontSize-Select,
 * Headings/Quote, Alignment, Listen, Media-Buttons (öffnen `EditorModals`)
 * und Reset. Aktive Formate glühen rot (`isActive`). Reine Darstellung:
 * alle Aktionen kommen als Callbacks herein. Benutzung: in
 * `components/RichTextEditor.tsx`. Gehört NICHT hierher: Editor-State,
 * Selection, Modals (`EditorModals.tsx`).
 */

import React from 'react';
import { Icon, type IconName } from '../icons/Icon';

export interface EditorActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  justifyFull: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  formatBlock: boolean;
}

export interface EditorToolbarProps {
  exec: (command: string, value?: string) => void;
  openModal: (type: 'link' | 'image' | 'video') => void;
  activeFormats: EditorActiveFormats;
  currentFontSize: string;
  t: any;
}

const ToolbarBtn: React.FC<{
  icon: IconName;
  isActive?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}> = ({ icon, isActive, onClick, title, disabled }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    className={`p-2 rounded-md transition duration-200 flex items-center justify-center relative group
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      ${isActive
        ? 'text-red-500 bg-red-900/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] border border-red-900/30'
        : 'text-gray-400 hover:text-white hover:bg-neutral-800 hover:-translate-y-0.5'
      }
    `}
    title={title}
  >
    <Icon name={icon} size={18} strokeWidth={isActive ? 2.5 : 2} />
    {/* Tooltip */}
    <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-xs text-white px-2 py-1 rounded border border-neutral-700 whitespace-nowrap z-50 pointer-events-none shadow-lg">
      {title}
    </span>
  </button>
);

const Divider = () => <div className="w-px h-6 bg-neutral-800 mx-1"></div>;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  exec,
  openModal,
  activeFormats,
  currentFontSize,
  t,
}) => (
  <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 z-40 sticky top-0">

    {/* History */}
    <div className="flex gap-0.5">
        <ToolbarBtn icon="undo" onClick={() => exec('undo')} title={t.home.editor.undo} />
        <ToolbarBtn icon="redo" onClick={() => exec('redo')} title={t.home.editor.redo} />
    </div>

    <Divider />

    {/* Styles */}
    <div className="flex gap-0.5">
        <ToolbarBtn icon="bold" isActive={activeFormats.bold} onClick={() => exec('bold')} title={t.home.editor.bold} />
        <ToolbarBtn icon="italic" isActive={activeFormats.italic} onClick={() => exec('italic')} title={t.home.editor.italic} />
        <ToolbarBtn icon="underline" isActive={activeFormats.underline} onClick={() => exec('underline')} title={t.home.editor.underline} />
        <ToolbarBtn icon="strikethrough" isActive={activeFormats.strikethrough} onClick={() => exec('strikeThrough')} title={t.home.editor.strikethrough} />
    </div>

    <Divider />

    {/* Structure & Typography */}
    <div className="flex gap-0.5 items-center">
         <div className="relative group mx-1">
            <select
                value={currentFontSize}
                onChange={(e) => exec('fontSize', e.target.value)}
                className="bg-black text-xs text-gray-300 rounded border border-neutral-700 hover:border-red-500 pl-2 pr-1 py-1 focus:outline-none cursor-pointer appearance-none w-20 h-8"
                title={t.home.editor.fontSize}
            >
                <option value="1">{t.home.editor.sizeSmall}</option>
                <option value="2">{t.home.editor.sizeNormal}</option>
                <option value="3">{t.home.editor.sizeMedium}</option>
                <option value="4">{t.home.editor.sizeLarge}</option>
                <option value="5">{t.home.editor.sizeXL}</option>
                <option value="6">{t.home.editor.sizeXXL}</option>
                <option value="7">{t.home.editor.sizeHero}</option>
            </select>
        </div>
        <ToolbarBtn icon="heading-2" onClick={() => exec('formatBlock', '<h2>')} title={t.home.editor.heading2} />
        <ToolbarBtn icon="heading-1" onClick={() => exec('formatBlock', '<h3>')} title={t.home.editor.heading3} />
        <ToolbarBtn icon="quote" onClick={() => exec('formatBlock', '<blockquote>')} title={t.home.editor.blockquote} />
    </div>

    <Divider />

    {/* Alignment */}
    <div className="flex gap-0.5">
        <ToolbarBtn icon="align-left" isActive={activeFormats.justifyLeft} onClick={() => exec('justifyLeft')} title={t.home.editor.alignLeft} />
        <ToolbarBtn icon="align-center" isActive={activeFormats.justifyCenter} onClick={() => exec('justifyCenter')} title={t.home.editor.alignCenter} />
        <ToolbarBtn icon="align-right" isActive={activeFormats.justifyRight} onClick={() => exec('justifyRight')} title={t.home.editor.alignRight} />
        <ToolbarBtn icon="align-justify" isActive={activeFormats.justifyFull} onClick={() => exec('justifyFull')} title={t.home.editor.justify} />
    </div>

    <Divider />

    {/* Lists */}
    <div className="flex gap-0.5">
        <ToolbarBtn icon="list" isActive={activeFormats.insertUnorderedList} onClick={() => exec('insertUnorderedList')} title={t.home.editor.unorderedList} />
        <ToolbarBtn icon="list-ordered" isActive={activeFormats.insertOrderedList} onClick={() => exec('insertOrderedList')} title={t.home.editor.orderedList} />
    </div>

    <Divider />

    {/* Media */}
    <div className="flex gap-0.5">
        <ToolbarBtn icon="link" onClick={() => openModal('link')} title={t.home.editor.insertLink} />
        <ToolbarBtn icon="image" onClick={() => openModal('image')} title={t.home.editor.insertImage} />
        <ToolbarBtn icon="youtube" onClick={() => openModal('video')} title={t.home.editor.insertVideo} />
    </div>

    <div className="flex-grow"></div>

    {/* System */}
    <div className="flex gap-2 border-l border-neutral-800 pl-2">
        <ToolbarBtn icon="remove-formatting" onClick={() => exec('removeFormat')} title={t.home.editor.removeFormat} />
    </div>

  </div>
);
