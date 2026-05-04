import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
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
  const currentVersion = useRef(0);
  const emitTimer = useRef(null);
  const editorContainerRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
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
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        socket.emit('edit-content', { docId, html, version: currentVersion.current });
      }, 60);
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

    socket.on('load-document', (payload) => {
      const html = typeof payload === 'string' ? payload : payload?.html;
      const version = typeof payload === 'object' && payload !== null ? payload.version : 0;
      currentVersion.current = Number(version || 0);
      isRemoteUpdate.current = true;
      editor.commands.setContent(html || '', false);
      isRemoteUpdate.current = false;
    });

    socket.on('update-content', ({ html, version }) => {
      const incomingVersion = Number(version || 0);
      if (incomingVersion <= currentVersion.current) return;
      currentVersion.current = incomingVersion;
      if (html === editor.getHTML()) return;
      isRemoteUpdate.current = true;
      const { from, to } = editor.state.selection;
      editor.commands.setContent(html, false);
      try {
        const maxPos = Math.max(1, editor.state.doc.content.size);
        editor.commands.setTextSelection({
          from: Math.min(from, maxPos),
          to: Math.min(to, maxPos)
        });
      } catch {
        // Если позиция каретки изменилась после remote-обновления, оставляем дефолтную.
      }
      isRemoteUpdate.current = false;
    });

    socket.on('document-version', (version) => {
      const incomingVersion = Number(version || 0);
      if (incomingVersion > currentVersion.current) {
        currentVersion.current = incomingVersion;
      }
    });

    socket.on('participants-update', (users) => {
      setParticipants(users);
      setRemoteCursors((prev) => {
        const allowedSocketIds = new Set(users.map((user) => user.socketId));
        const next = {};
        Object.entries(prev).forEach(([socketId, value]) => {
          if (allowedSocketIds.has(socketId)) next[socketId] = value;
        });
        return next;
      });
    });

    socket.on('cursor-update', (cursorData) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [cursorData.socketId]: cursorData
      }));
    });

    socket.on('access-denied', () => {
      alert('У вас нет доступа к этому документу');
      navigate('/');
    });

    return () => {
      if (emitTimer.current) clearTimeout(emitTimer.current);
      socket.off('load-document');
      socket.off('update-content');
      socket.off('document-version');
      socket.off('participants-update');
      socket.off('cursor-update');
      socket.off('access-denied');
    };
  }, [editor, socket, docId, token, navigate, inviteToken]);

  useEffect(() => {
    if (!editor || !socket) return;

    const sendCursor = () => {
      const { from, to } = editor.state.selection;
      socket.emit('cursor-update', { docId, from, to });
    };

    sendCursor();
    editor.on('selectionUpdate', sendCursor);
    editor.on('focus', sendCursor);

    return () => {
      editor.off('selectionUpdate', sendCursor);
      editor.off('focus', sendCursor);
    };
  }, [editor, socket, docId]);

  if (!editor) return null;

  const remoteCursorMarkers = Object.values(remoteCursors).map((cursor) => {
    if (!editorContainerRef.current || !editor.view) return null;

    try {
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const coords = editor.view.coordsAtPos(cursor.from);
      const top = coords.top - containerRect.top + editorContainerRef.current.scrollTop;
      const left = coords.left - containerRect.left + editorContainerRef.current.scrollLeft;

      return (
        <div
          key={cursor.socketId}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <div style={{ width: '2px', height: '20px', background: cursor.color }} />
          <div style={{
            marginTop: '2px',
            fontSize: '10px',
            color: 'white',
            background: cursor.color,
            borderRadius: '3px',
            padding: '1px 4px',
            whiteSpace: 'nowrap'
          }}>
            {cursor.username}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  });

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
      <div style={{ width: '100%', maxWidth: '210mm', marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {participants.map((user) => (
          <div key={user.socketId} style={{
            border: `1px solid ${user.color}`,
            color: user.color,
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '12px',
            background: '#fff'
          }}>
            {user.username}
          </div>
        ))}
      </div>
      <div className="editor-container" ref={editorContainerRef}>
        <EditorContent editor={editor} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {remoteCursorMarkers}
        </div>
      </div>
    </div>
  )
}
export default Editor;