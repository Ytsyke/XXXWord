import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import Toolbar from './Toolbar'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import axios from 'axios';

const Editor = ({ token }) => {
  const socket = useSocket(token);
  const { docId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const inviteToken = new URLSearchParams(location.search).get('invite');
  const isRemoteUpdate = useRef(false);
  const isLocallyTyping = useRef(false);
  const pendingRemoteHtml = useRef(null);
  const typingStopTimer = useRef(null);
  const emitTimer = useRef(null);
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

      isLocallyTyping.current = true;
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      typingStopTimer.current = setTimeout(() => {
        isLocallyTyping.current = false;
        if (pendingRemoteHtml.current && pendingRemoteHtml.current !== editor.getHTML()) {
          isRemoteUpdate.current = true;
          editor.commands.setContent(pendingRemoteHtml.current, false);
          isRemoteUpdate.current = false;
        }
        pendingRemoteHtml.current = null;
      }, 300);

      const html = editor.getHTML();
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        socket.emit('edit-content', { docId, html });
      }, 80);
    },
  });

  useEffect(() => {
    if (!editor || !socket) return;

    axios.get(`https://xxxword.onrender.com/api/auth/document/${docId}/access`, {
      headers: { Authorization: `Bearer ${token}` },
      params: inviteToken ? { invite: inviteToken } : undefined
    }).catch(() => {
      alert('У вас нет доступа к этому документу');
      navigate('/');
    });

    socket.emit('join-document', { docId, inviteToken });

    socket.on('load-document', (html) => {
      isRemoteUpdate.current = true;
      editor.commands.setContent(html || '', false);
      isRemoteUpdate.current = false;
    });

    socket.on('update-content', (html) => {
      if (html === editor.getHTML()) return;

      if (isLocallyTyping.current) {
        pendingRemoteHtml.current = html;
        return;
      }

      isRemoteUpdate.current = true;
      editor.commands.setContent(html, false);
      isRemoteUpdate.current = false;
    });

    socket.on('access-denied', () => {
      alert('У вас нет доступа к этому документу');
      navigate('/');
    });

    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      if (emitTimer.current) clearTimeout(emitTimer.current);
      socket.off('load-document');
      socket.off('update-content');
      socket.off('access-denied');
    };
  }, [editor, socket, docId, token, navigate, inviteToken]);

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      <div style={{ background: '#f3f2f1', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '6px 12px', cursor: 'pointer', background: '#ffffff', color: '#2b579a', border: '1px solid #d1d1d1', borderRadius: '4px' }}
          >
            Назад к документам
          </button>
          <button 
            onClick={async () => {
              try {
                const response = await axios.post(`https://xxxword.onrender.com/api/auth/document/${docId}/share`, {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const shareUrl = `${window.location.origin}${window.location.pathname}#/document/${docId}?invite=${response.data.inviteToken}`;
                await navigator.clipboard.writeText(shareUrl);
                alert("Ссылка приглашения скопирована!");
              } catch {
                alert("Не удалось создать ссылку доступа");
              }
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