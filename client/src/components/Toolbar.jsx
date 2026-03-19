import React from 'react'
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Type, Highlighter, Eraser, Trash2, RotateCcw, RotateCw
} from 'lucide-react'

const fonts = [
  'Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'
];
const sizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px'];

const Toolbar = ({ editor }) => {
  if (!editor) return null

  return (
    <div className="word-toolbar">
      {/* Группа: История */}
      <div className="toolbar-section">
        <button onClick={() => editor.chain().focus().undo().run()} title="Отменить"><RotateCcw size={16}/></button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Вернуть"><RotateCw size={16}/></button>
      </div>

      <div className="v-divider" />

      {/* Группа: Шрифт */}

      <div className="toolbar-section">
        <div className="tool-row">
          {/* Выбор шрифта */}
          <select 
            onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="font-select"
          >   
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>

          {/* Выбор размера */}
          <select 
            onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}
            className="size-select"
          >   
            {sizes.map(size => (
              <option key={size} value={size}>{size.replace('px', '')}</option>
            ))}
          </select>
        </div>
  
        <div className="tool-row">
        </div>
      </div>

      <div className="v-divider" />

      {/* Группа: Абзац */}
      <div className="toolbar-section">
        <div className="tool-row">
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><AlignLeft size={16}/></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><AlignCenter size={16}/></button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><AlignRight size={16}/></button>
          <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}><AlignJustify size={16}/></button>
        </div>
        <div className="tool-row">
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}><List size={16}/></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}><ListOrdered size={16}/></button>
        </div>
      </div>

      <div className="v-divider" />

      {/* Очистка */}
      <div className="toolbar-section">
        <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Очистить всё">
          <Eraser size={16} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar