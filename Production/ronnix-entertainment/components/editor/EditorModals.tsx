/**
 * editor/EditorModals.tsx — Link-/Bild-/YouTube-Dialoge des RichTextEditors.
 *
 * Feature: drei Modals (URL + Optionen) inkl. Einfüge-Logik (`exec`):
 * Link (Text/Target), Bild (Alt/Breite + Preview) und YouTube (ID-Parsing,
 * Embed-HTML). `restoreSelection` stellt die Textmarkierung vor dem Einfügen
 * wieder her. Benutzung: in `components/RichTextEditor.tsx` hinter der
 * Editor-Fläche. Gehört NICHT hierher: Toolbar (`EditorToolbar.tsx`),
 * Editor-State/Selection (RichTextEditor).
 */

import React from 'react';
import { Icon } from '../icons/Icon';

export type EditorModalType = 'link' | 'image' | 'video';

export interface EditorModalsProps {
  activeModal: EditorModalType | null;
  modalInputs: any;
  setModalInputs: React.Dispatch<React.SetStateAction<any>>;
  closeModal: () => void;
  exec: (command: string, value?: string) => void;
  restoreSelection: () => void;
  /**
   * Markierter Text (`null` = keine Auswahl) — entscheidet Link-Modus exakt
   * wie zuvor (`insertHTML` nur bei abweichendem Text, sonst `createLink`).
   */
  selectionText: string | null;
  t: any;
}

// Changed from absolute to fixed to ensure it appears on top of everything and isn't cut off
const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
    <div className="bg-neutral-900 border-2 border-red-600 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] w-full max-w-md overflow-hidden transform scale-100 transition max-h-[90vh] overflow-y-auto">
      <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
        <h3 className="font-retro text-white tracking-wide text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><Icon name="x" size={20} /></button>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  </div>
);

export const EditorModals: React.FC<EditorModalsProps> = ({
  activeModal,
  modalInputs,
  setModalInputs,
  closeModal,
  exec,
  restoreSelection,
  selectionText,
  t,
}) => {
  // 1. LINK INSERTION (eigener Text → HTML-Link, sonst `createLink` auf Auswahl)
  const confirmLink = () => {
    restoreSelection();
    const { url, text, openNewTab } = modalInputs;
    if (url) {
       if (text && selectionText !== null && selectionText !== text) {
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
        const html = `<img src="${url}" alt="${alt || ''}" loading="lazy" decoding="async" ${widthStyle} class="rounded-lg border border-neutral-700 my-4" />`;
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

  return (
    <>
      {/* 1. LINK MODAL */}
      {activeModal === 'link' && (
        <ModalWrapper title={t.home.editor.insertLink} onClose={closeModal}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="editor-link-text" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.displayText}</label>
                    <input
                        id="editor-link-text"
                        type="text"
                        value={modalInputs.text || ''}
                        onChange={e => setModalInputs({...modalInputs, text: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="editor-link-url" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.url}</label>
                    <input
                        id="editor-link-url"
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
                    <label htmlFor="editor-img-url" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.imgUrl}</label>
                    <div className="relative">
                        <Icon name="image" size={16} className="absolute left-3 top-3 text-gray-600" />
                        <input
                            id="editor-img-url"
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
                        <img src={modalInputs.url} alt="Preview" loading="lazy" decoding="async" className="max-h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="editor-img-alt" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.imgAlt}</label>
                        <input
                            id="editor-img-alt"
                            type="text"
                            placeholder="Beschreibung"
                            value={modalInputs.alt || ''}
                            onChange={e => setModalInputs({...modalInputs, alt: e.target.value})}
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="editor-img-width" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.width}</label>
                        <select
                            id="editor-img-width"
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
                    <label htmlFor="editor-video-url" className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.home.editor.videoLink}</label>
                    <div className="relative">
                        <Icon name="youtube" size={16} className="absolute left-3 top-3 text-red-500" />
                        <input
                            id="editor-video-url"
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
    </>
  );
};
