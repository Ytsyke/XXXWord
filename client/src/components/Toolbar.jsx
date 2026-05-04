import React from 'react'
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Eraser, RotateCcw, RotateCw, Download
} from 'lucide-react'

const fonts = [
  'Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'
];
const sizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px'];

const Toolbar = ({ editor, docId }) => {
  if (!editor) return null

  const iconSize = 14;

  const exportHtml = () => {
    const html = editor.getHTML();
    const fileName = `document-${docId || 'export'}.html`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="word-toolbar">
      {/* Группа: История */}
      <div className="toolbar-section">
        <button onClick={() => editor.chain().focus().undo().run()} title="Отменить"><RotateCcw size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Вернуть"><RotateCw size={iconSize}/></button>
      </div>

      <div className="v-divider" />

      {/* Группа: Шрифт */}

      <div className="toolbar-section">
        {/* Выбор шрифта */}
        <select 
          onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="font-select"
          title="Шрифт"
        >   
          {fonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>

        {/* Выбор размера */}
        <select 
          className="size-select"
          title="Размер"
          onChange={e => {
            const size = e.target.value;
            editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
          }}
        >   
          {sizes.map(size => (
            <option key={size} value={size}>{size.replace('px', '')}</option>
          ))}
        </select>
      </div>

      <div className="v-divider" />

      {/* Группа: Абзац */}
      <div className="toolbar-section">
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="По левому краю"><AlignLeft size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="По центру"><AlignCenter size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="По правому краю"><AlignRight size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} title="По ширине"><AlignJustify size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Маркированный список"><List size={iconSize}/></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Нумерованный список"><ListOrdered size={iconSize}/></button>
      </div>

      <div className="v-divider" />

      {/* Очистка */}
      <div className="toolbar-section">
        <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Очистить всё">
          <Eraser size={iconSize} />
        </button>
      </div>

      <div className="toolbar-spacer" />

      <button className="toolbar-export-btn" onClick={exportHtml} title="Скачать HTML">
        <Download size={iconSize} />
        Экспорт
      </button>
    </div>
  )
}

export default Toolbar