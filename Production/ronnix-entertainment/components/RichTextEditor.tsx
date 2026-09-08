
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, 
  Link as LinkIcon, Image as ImageIcon, Youtube, 
  Undo, Redo, RemoveFormatting, 
  X, Type, Heading1, Heading2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// --- HELPER COMPONENTS FOR MODALS ---

// Changed from absolute to fixed to ensure it appears on top of everything and isn't cut off
const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
    <div className="bg-neutral-900 border-2 border-red-600 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] w-full max-w-md overflow-hidden transform scale-100 transition-all max-h-[90vh] overflow-y-auto">
      <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
        <h3 className="font-retro text-white tracking-wide text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  </div>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
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

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
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
    } catch (e) {
        // ignore
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

  // 1. LINK INSERTION
  const confirmLink = () => {
    restoreSelection();
    const { url, text, openNewTab } = modalInputs;
    if (url) {
       if (text && savedSelection.current && savedSelection.current.toString() !== text) {
           const targetAttr = openNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
           exec('insertHTML', `<a href="${url}"${targetAttr}>${text}</a>`);
       } else {
           exec('createLink', url);
       }
    }
    closeModal();
  };

  // 2. IMAGE INSERTION
  const confirmImage = () => {
    restoreSelection();
    const { url, alt, width } = modalInputs;
    if (url) {
        const widthStyle = width ? `style="width: ${width};"` : '';
        const html = `<img src="${url}" alt="${alt || ''}" ${widthStyle} class="rounded-lg border border-neutral-700 my-4" />`;
        exec('insertHTML', html);
        // Add a paragraph break after image to allow continuing typing
        exec('insertHTML', '<p><br></p>');
    }
    closeModal();
  };

  // 3. YOUTUBE INSERTION
  const confirmVideo = () => {
    restoreSelection();
    const { url } = modalInputs;
    if (url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            const html = `
                <div class="aspect-video w-full my-6 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <p><br></p>
            `;
            exec('insertHTML', html);
        } else {
            alert(t.home.editor.invalidYoutube);
            return;
        }
    }
    closeModal();
  };

  // --- UI HELPER ---

  const ToolbarBtn: React.FC<{ 
    icon: React.ElementType; 
    isActive?: boolean; 
    onClick: () => void; 
    title: string;
    disabled?: boolean;
  }> = ({ icon: Icon, isActive, onClick, title, disabled }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      className={`p-2 rounded-md transition-all duration-200 flex items-center justify-center relative group
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        ${isActive 
          ? 'text-red-500 bg-red-900/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] border border-red-900/30' 
          : 'text-gray-400 hover:text-white hover:bg-neutral-800 hover:-translate-y-0.5'
        }
      `}
      title={title}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      {/* Tooltip */}
      <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-xs text-white px-2 py-1 rounded border border-neutral-700 whitespace-nowrap z-50 pointer-events-none shadow-lg">
        {title}
      </span>
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-neutral-800 mx-1"></div>;

  return (
    <div className="flex flex-col border border-neutral-700 rounded-xl overflow-hidden bg-black shadow-2xl relative">
      
      {/* --- TOOLBAR --- */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 z-40 sticky top-0">
        
        {/* History */}
        <div className="flex gap-0.5">
            <ToolbarBtn icon={Undo} onClick={() => exec('undo')} title={t.home.editor.undo} />
            <ToolbarBtn icon={Redo} onClick={() => exec('redo')} title={t.home.editor.redo} />
        </div>
        
        <Divider />

        {/* Styles */}
        <div className="flex gap-0.5">
            <ToolbarBtn icon={Bold} isActive={activeFormats.bold} onClick={() => exec('bold')} title={t.home.editor.bold} />
            <ToolbarBtn icon={Italic} isActive={activeFormats.italic} onClick={() => exec('italic')} title={t.home.editor.italic} />
            <ToolbarBtn icon={Underline} isActive={activeFormats.underline} onClick={() => exec('underline')} title={t.home.editor.underline} />
            <ToolbarBtn icon={Strikethrough} isActive={activeFormats.strikethrough} onClick={() => exec('strikeThrough')} title={t.home.editor.strikethrough} />
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
            <ToolbarBtn icon={Heading2} onClick={() => exec('formatBlock', '<h2>')} title={t.home.editor.heading2} />
            <ToolbarBtn icon={Heading1} onClick={() => exec('formatBlock', '<h3>')} title={t.home.editor.heading3} />
            <ToolbarBtn icon={Quote} onClick={() => exec('formatBlock', '<blockquote>')} title={t.home.editor.blockquote} />
        </div>

        <Divider />

        {/* Alignment */}
        <div className="flex gap-0.5">
            <ToolbarBtn icon={AlignLeft} isActive={activeFormats.justifyLeft} onClick={() => exec('justifyLeft')} title={t.home.editor.alignLeft} />
            <ToolbarBtn icon={AlignCenter} isActive={activeFormats.justifyCenter} onClick={() => exec('justifyCenter')} title={t.home.editor.alignCenter} />
            <ToolbarBtn icon={AlignRight} isActive={activeFormats.justifyRight} onClick={() => exec('justifyRight')} title={t.home.editor.alignRight} />
            <ToolbarBtn icon={AlignJustify} isActive={activeFormats.justifyFull} onClick={() => exec('justifyFull')} title={t.home.editor.justify} />
        </div>

        <Divider />

        {/* Lists */}
        <div className="flex gap-0.5">
            <ToolbarBtn icon={List} isActive={activeFormats.insertUnorderedList} onClick={() => exec('insertUnorderedList')} title={t.home.editor.unorderedList} />
            <ToolbarBtn icon={ListOrdered} isActive={activeFormats.insertOrderedList} onClick={() => exec('insertOrderedList')} title={t.home.editor.orderedList} />
        </div>

        <Divider />

        {/* Media */}
        <div className="flex gap-0.5">
            <ToolbarBtn icon={LinkIcon} onClick={() => openModal('link')} title={t.home.editor.insertLink} />
            <ToolbarBtn icon={ImageIcon} onClick={() => openModal('image')} title={t.home.editor.insertImage} />
            <ToolbarBtn icon={Youtube} onClick={() => openModal('video')} title={t.home.editor.insertVideo} />
        </div>

        <div className="flex-grow"></div>

        {/* System */}
        <div className="flex gap-2 border-l border-neutral-800 pl-2">
            <ToolbarBtn icon={RemoveFormatting} onClick={() => exec('removeFormat')} title={t.home.editor.removeFormat} />
        </div>

      </div>

      {/* --- EDITOR AREA (WYSIWYG) --- */}
      <div className="relative min-h-[500px] bg-black">
           <div 
                ref={editorRef}
                contentEditable 
                onInput={handleInput}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                className="editor-content p-8 min-h-[500px] focus:outline-none text-gray-200"
                data-placeholder={placeholder || t.home.editor.placeholder}
            />
      </div>

      {/* --- MODALS --- */}

      {/* 1. LINK MODAL */}
      {activeModal === 'link' && (
        <ModalWrapper title={t.home.editor.insertLink} onClose={closeModal}>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.displayText}</label>
                    <input 
                        type="text" 
                        value={modalInputs.text || ''} 
                        onChange={e => setModalInputs({...modalInputs, text: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.url}</label>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="https://google.com"
                        value={modalInputs.url || ''} 
                        onChange={e => setModalInputs({...modalInputs, url: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="newTab"
                        checked={modalInputs.openNewTab || false}
                        onChange={e => setModalInputs({...modalInputs, openNewTab: e.target.checked})}
                        className="rounded bg-black border-neutral-700 text-red-600 focus:ring-red-900"
                    />
                    <label htmlFor="newTab" className="text-sm text-gray-400 cursor-pointer">{t.home.editor.openNewTab}</label>
                </div>
                <button 
                    onClick={confirmLink}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition-colors"
                >
                    {t.home.editor.submitLink}
                </button>
            </div>
        </ModalWrapper>
      )}

      {/* 2. IMAGE MODAL */}
      {activeModal === 'image' && (
        <ModalWrapper title={t.home.editor.insertImage} onClose={closeModal}>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.imgUrl}</label>
                    <div className="relative">
                        <ImageIcon size={16} className="absolute left-3 top-3 text-gray-600" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="https://example.com/image.jpg"
                            value={modalInputs.url || ''} 
                            onChange={e => setModalInputs({...modalInputs, url: e.target.value})}
                            className="w-full bg-black border border-neutral-700 rounded p-2 pl-9 text-white focus:border-red-500 focus:outline-none"
                        />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{t.home.editor.hostingHint}</p>
                </div>
                
                {/* Preview */}
                {modalInputs.url && (
                    <div className="aspect-video bg-black rounded border border-neutral-800 flex items-center justify-center overflow-hidden">
                        <img src={modalInputs.url} alt="Preview" className="max-h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.imgAlt}</label>
                        <input 
                            type="text" 
                            placeholder="Beschreibung"
                            value={modalInputs.alt || ''} 
                            onChange={e => setModalInputs({...modalInputs, alt: e.target.value})}
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.width}</label>
                        <select
                            value={modalInputs.width || '100%'}
                            onChange={e => setModalInputs({...modalInputs, width: e.target.value})}
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                        >
                            <option value="100%">{t.home.editor.widthFull}</option>
                            <option value="75%">75%</option>
                            <option value="50%">{t.home.editor.widthHalf}</option>
                            <option value="25%">{t.home.editor.widthSmall}</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={confirmImage}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition-colors"
                >
                    {t.home.editor.submitImage}
                </button>
            </div>
        </ModalWrapper>
      )}

      {/* 3. VIDEO MODAL */}
      {activeModal === 'video' && (
        <ModalWrapper title={t.home.editor.insertVideo} onClose={closeModal}>
             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.home.editor.videoLink}</label>
                    <div className="relative">
                        <Youtube size={16} className="absolute left-3 top-3 text-red-500" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={modalInputs.url || ''} 
                            onChange={e => setModalInputs({...modalInputs, url: e.target.value})}
                            className="w-full bg-black border border-neutral-700 rounded p-2 pl-9 text-white focus:border-red-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="bg-neutral-800 p-3 rounded text-sm text-gray-400">
                    <p>{t.home.editor.videoHint}</p>
                </div>
                <button 
                    onClick={confirmVideo}
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded transition-colors"
                >
                    {t.home.editor.submitVideo}
                </button>
            </div>
        </ModalWrapper>
      )}

      {/* --- CSS STYLES FOR EDITOR CONTENT --- 
          These explicit styles ensure WYSIWYG behavior even if standard CSS reset is applied 
      */}
      <style>{`
        /* Lists: Ensure they have bullets and spacing */
        .editor-content ul {
            list-style-type: disc !important;
            padding-left: 1.5rem !important;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        .editor-content ol {
            list-style-type: decimal !important;
            padding-left: 1.5rem !important;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        .editor-content li {
            display: list-item !important;
            margin-bottom: 0.25rem;
        }

        /* Headings */
        .editor-content h1, .editor-content h2, .editor-content h3 {
            font-family: 'Bangers', cursive;
            color: white;
            line-height: 1.2;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        .editor-content h2 { font-size: 2em; color: #dc2626; } /* Tailwind red-600 */
        .editor-content h3 { font-size: 1.5em; color: #f87171; } /* Tailwind red-400 */

        /* Blockquotes */
        .editor-content blockquote {
            border-left: 4px solid #dc2626;
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: #d1d5db; /* gray-300 */
            font-style: italic;
            background-color: rgba(23, 23, 23, 0.5); /* neutral-900/50 */
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }

        /* Links */
        .editor-content a {
            color: #ef4444; /* red-500 */
            text-decoration: underline;
            cursor: pointer;
        }

        /* Images */
        .editor-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }

        /* Caret Color */
        .editor-content {
            caret-color: #dc2626;
        }

        /* Placeholder */
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #555;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
};
