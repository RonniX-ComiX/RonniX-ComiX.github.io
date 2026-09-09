/**
 * RichTextEditor.tsx — WYSIWYG-Editor (contentEditable) für CreatePost.
 *
 * Feature: formatiert per `document.execCommand`, tracked Formate
 * (`checkFormats`), sichert die Textauswahl über Modal-Dialoge hinweg und
 * meldet HTML via `onChange`. Darstellung kommt aus `editor/EditorToolbar`
 * (Leiste) und `editor/EditorModals` (Link/Bild/Video-Dialoge); Content-Stile
 * stehen zentral in `index.css` (`.editor-content`). Benutzung:
 * `<RichTextEditor value onChange placeholder />`. Gehört NICHT hierher:
 * Toolbar/Modals (siehe `editor/`), Persistenz/Upload (`pages/CreatePost.tsx`).
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { EditorToolbar } from './editor/EditorToolbar';
import { EditorModals } from './editor/EditorModals';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** DOM-Id der Editor-Fläche (Label-Assoziation). */
  id?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, id }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // State for Modals
  const [activeModal, setActiveModal] = useState<'link' | 'image' | 'video' | null>(null);
  const [modalInputs, setModalInputs] = useState<any>({});

  // State for Selection Saving
  const savedSelection = useRef<Range | null>(null);

  // Active Formats State
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    formatBlock: false,
  });

  const [currentFontSize, setCurrentFontSize] = useState('3');

  // Initialize content (bewusst nur einmal: sonst würde jeder Keystroke den DOM-Inhalt resetten)
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // --- SELECTION HANDLING ---

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelection.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  };

  // --- COMMAND EXECUTION ---

  const checkFormats = useCallback(() => {
    if (!editorRef.current) return;

    // We wrapped this in try-catch because queryCommandState can sometimes throw on firefox if unmounted
    try {
        setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikethrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        formatBlock: false,
        });

        const size = document.queryCommandValue('fontSize');
        if (size) setCurrentFontSize(size);
    } catch {
        // ignore: Toolbar-State bleibt beim letzten bekannten Stand
    }
  }, []);

  const exec = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    checkFormats();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== value) {
        onChange(html);
      }
    }
  };

  // --- MODAL HANDLERS ---

  const openModal = (type: 'link' | 'image' | 'video') => {
    saveSelection();
    setModalInputs({}); // Reset inputs
    setActiveModal(type);

    // Pre-fill link text if selected
    if (type === 'link' && savedSelection.current) {
        setModalInputs({ text: savedSelection.current.toString(), url: '' });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
        restoreSelection();
        editorRef.current?.focus();
    }, 0);
  };

  return (
    <div className="flex flex-col border border-neutral-700 rounded-xl overflow-hidden bg-black shadow-2xl relative">

      {/* --- TOOLBAR --- */}
      <EditorToolbar
        exec={exec}
        openModal={openModal}
        activeFormats={activeFormats}
        currentFontSize={currentFontSize}
        t={t}
      />

      {/* --- EDITOR AREA (WYSIWYG) --- */}
      <div className="relative min-h-[500px] bg-black">
           <div
                ref={editorRef}
                id={id}
                contentEditable
                role="textbox"
                aria-multiline="true"
                aria-label={placeholder || t.home.editor.placeholder}
                onInput={handleInput}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                className="editor-content p-8 min-h-[500px] text-gray-200"
                data-placeholder={placeholder || t.home.editor.placeholder}
            />
      </div>

      {/* --- MODALS --- */}
      <EditorModals
        activeModal={activeModal}
        modalInputs={modalInputs}
        setModalInputs={setModalInputs}
        closeModal={closeModal}
        exec={exec}
        restoreSelection={restoreSelection}
        selectionText={savedSelection.current ? savedSelection.current.toString() : null}
        t={t}
      />
    </div>
  );
};
