import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import Toolbar from './Toolbar'
import './Toolbar.css'
import '../App.css'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { useParams } from 'react-router-dom';

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },
})

const Editor = () => {
  const socket = useSocket();
  const { docId } = useParams();
  // const documentId = "my-first-document";
  // Флаг, который блокирует отправку сокетов, когда мы получаем данные извне
  const isRemoteUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ 
        types: ['heading', 'paragraph']
      }),
    ],
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;

      const html = editor.getHTML();
      socket.emit('edit-content', { docId, html });
    },
  })

  useEffect(() => {
    if (!editor || !socket) return;

    socket.emit('join-document', docId);

    const loadHandler = (html) => {
      isRemoteUpdate.current = true;
      editor.commands.setContent(html, false);
      isRemoteUpdate.current = false;
    };

    const receiveHandler = (html) => {
      if (html !== editor.getHTML()) {
        isRemoteUpdate.current = true; 
        
        const { from, to } = editor.state.selection;
        editor.commands.setContent(html, false);
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (e) {
          console.warn("Could not restore cursor position");
        }
        isRemoteUpdate.current = false; 
      }
    };

    socket.on('load-document', loadHandler);
    socket.on('update-content', receiveHandler);

    return () => {
      socket.off('load-document', loadHandler);
      socket.off('update-content', receiveHandler);
    };
  }, [editor, socket, docId]);

  if (!editor) return null;

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка на документ скопирована! Отправьте её другу для совместной правки.");
  };

  return (
  <div className="editor-wrapper">
      {/* Прокидываем функцию копирования в тулбар или вызываем здесь */}
      <div className="share-ыpanel" style={{ background: '#f3f2f1', padding: '5px 15px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={copyShareLink} className="share-button">
            Поделиться ссылкой
          </button>
      </div>
      <Toolbar editor={editor} />
      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default Editor;