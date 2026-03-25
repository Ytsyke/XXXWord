import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import Toolbar from './Toolbar'
import { useParams } from 'react-router-dom';
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'

const Editor = () => {
  const socket = useSocket();
  const { docId } = useParams();
  const isRemoteUpdate = useRef(false);
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      const html = editor.getHTML();
      socket.emit('edit-content', { docId, html });
    },
  });

  useEffect(() => {
    if (!editor || !socket) return;

    socket.emit('join-document', docId);

    socket.on('load-document', (html) => {
      isRemoteUpdate.current = true;
      editor.commands.setContent(html || '', false);
      isRemoteUpdate.current = false;
    });

    socket.on('update-content', (html) => {
      if (html !== editor.getHTML()) {
        isRemoteUpdate.current = true;
        const { from, to } = editor.state.selection;
        editor.commands.setContent(html, false);
        try { editor.commands.setTextSelection({ from, to }); } catch (e) {}
        isRemoteUpdate.current = false;
      }
    });

    return () => {
      socket.off('load-document');
      socket.off('update-content');
    };
  }, [editor, socket, docId]);

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      <div style={{ background: '#f3f2f1', padding: '5px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Ссылка скопирована!");
            }} 
            style={{padding: '5px 15px', cursor: 'pointer', background: '#2b579a', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            Поделиться доступом
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