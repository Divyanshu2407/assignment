import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Node } from '@tiptap/core';
import { FaFileAlt, FaGlobe, FaLanguage, FaRegEdit, FaBookmark, FaHistory, FaPaperPlane } from "react-icons/fa";

// Custom PageBreak node for manual and automatic breaks
const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  parseHTML() {
    return [{ tag: 'div.page-break' }];
  },
  renderHTML() {
    return ['div', { class: 'page-break' }];
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertContent({ type: 'pageBreak' }),
    };
  },
});

// MenuBar component with fixed hover events and debug
const MenuBar = ({ onInsertBreak }) => {
  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '8px', marginBottom: '16px', borderRadius: '4px', display: 'flex', justifyContent: 'flex-start', zIndex: 1000, position: 'sticky', top: '0' }}>
      <button
        onClick={() => {
          if (typeof onInsertBreak === 'function') {
            console.log('Inserting break...');
            onInsertBreak();
            setTimeout(() => {
              const wrapper = document.querySelector('.editor-wrapper');
              if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
            }, 0);
          } else {
            console.error('onInsertBreak is not a function:', onInsertBreak);
          }
        }}
        style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '8px' }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#007bff')}
      >
        Insert Page Break
      </button>
    </div>
  );
};

// Custom Editor component with forwardRef for imperative handling
const CustomEditor = forwardRef(({ setInsertBreak }, ref) => {
  const wrapperRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [contentBeforeTyping, setContentBeforeTyping] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, PageBreak],
    content: `
      <p>Sample legal clause 1: This is page 1. (${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}) - 11:20 PM IST, August 25, 2025</p>
      <h1>Section 1</h1>
      <p>Start typing here to convert to A4 page...</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none',
        contenteditable: true,
      },
    },
    onUpdate: ({ editor }) => {
      if (!isEditorReady) setIsEditorReady(true);
      const currentContent = editor.getHTML();
      if (currentContent !== contentBeforeTyping && !isProcessing) {
        setContentBeforeTyping(currentContent);
        handleTypingConversion();
      }
    },
  });

  const insertBreak = useCallback(() => {
    if (editor && editor.isEditable && !isProcessing) {
      setIsProcessing(true);
      console.log('Editor state before insert:', editor.getJSON());
      const isSuccessful = editor.chain().focus().insertContent({ type: 'pageBreak' }).run();
      console.log('Page break inserted:', isSuccessful, 'Editor state after insert:', editor.getJSON());
      if (isSuccessful) {
        updatePages();
      } else {
        console.error('Insert command failed, trying fallback');
        editor.chain().focus().insertContent('<div class="page-break"></div>').run();
        updatePages();
      }
      setIsProcessing(false);
    } else {
      console.error('Editor not ready or not editable, or processing:', editor, isProcessing);
    }
  }, [editor, isProcessing]);

  const handleTypingConversion = () => {
    if (editor && !isProcessing) {
      insertBreak();
    }
  };

  const updatePages = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !editor) return;

    const content = editor.getHTML();
    const pages = wrapper.getElementsByClassName('tiptap-page');
    if (pages.length === 0) {
      const page = document.createElement('div');
      page.className = 'tiptap-page';
      page.innerHTML = `<div class="tiptap-header">Legal Document - Page 1 of ${totalPages}</div><div class="ProseMirror" style="white-space: pre-wrap;">${content}</div><div class="tiptap-footer">Confidential | 2025 | Page 1 of ${totalPages}</div>`;
      wrapper.innerHTML = '';
      wrapper.appendChild(page);
    }

    const doc = editor.getJSON();
    const lastContent = doc.content[doc.content.length - 1];
    if (lastContent && lastContent.type === 'pageBreak') {
      const newPage = document.createElement('div');
      newPage.className = 'tiptap-page read-only';
      newPage.innerHTML = `<div class="tiptap-header">Legal Document - Page ${totalPages + 1} of ${totalPages + 1}</div><div class="ProseMirror" style="white-space: pre-wrap;" contenteditable="false"></div><div class="tiptap-footer">Confidential | 2025 | Page ${totalPages + 1} of ${totalPages + 1}</div>`;
      wrapper.appendChild(newPage);
      setTotalPages(totalPages + 1);
      setTimeout(() => {
        if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
      }, 0);
    }
  };

  useEffect(() => {
    if (editor && isEditorReady) {
      if (ref) ref.current = { insertBreak };
      if (setInsertBreak) setInsertBreak(insertBreak);
    }
  }, [editor, insertBreak, isEditorReady, ref, setInsertBreak]);

  useEffect(() => {
    if (!editor || !wrapperRef.current || !isEditorReady) return;

    const checkHeight = () => {
      if (!isProcessing) updatePages();
    };
    const observer = new MutationObserver(checkHeight);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, { childList: true, subtree: true, characterData: true });
    }

    checkHeight();
    const interval = setInterval(checkHeight, 300);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [editor, insertBreak, isEditorReady, totalPages, isProcessing]);

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className="editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
});

// Main App component
const App = () => {
  const insertBreakRef = useRef();

  useEffect(() => {
    const checkEditorReady = setInterval(() => {
      if (insertBreakRef.current && typeof insertBreakRef.current.insertBreak === 'function') {
        clearInterval(checkEditorReady);
      }
    }, 200);
    return () => clearInterval(checkEditorReady);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar refined for Figma match */}
      {/* <div style={{ width: '250px', backgroundColor: '#6b21a8', color: 'white', padding: '16px', boxShadow: '4px 0 4px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>AI</h2>
        <button style ={{width: "250px", backgroundColor: "red", color: "white", padding: "10px 20px", border:"round", borderRadius: "5px" }}>New Chat </button>
        <ul style={{ listStyle: 'none', padding: '4px' }}>
          <li style={{ margin: '8px 0', padding: '4px', backgroundColor: '#5b1a98', borderRadius: '4px' }}>Lorem ipsum...</li>
          <li style={{ margin: '8px 0', padding: '4px', backgroundColor: '#5b1a98', borderRadius: '4px' }}>Consectetur...</li>
          <li style={{ margin: '8px 0', padding: '4px', backgroundColor: '#5b1a98', borderRadius: '4px' }}>View more</li>
        </ul>
      </div> */}

    <div className="sidebar">
      {/* Logo */}
      <h2 className="logo">Vettam.AI</h2>

      {/* New Chat Button */}
      <button className="newChatBtn">New Chat</button>

      {/* Features */}
      <div className="section">
        <span className="sectionLabel">Features</span>
        <div className="menuItem"><FaFileAlt /> Workspace</div>
        <div className="menuItem"><FaGlobe /> Research</div>
        <div className="menuItem"><FaLanguage /> Translate</div>
        <div className="menuItem"><FaRegEdit /> Write</div>
      </div>

      {/* Tools */}
      <div className="section">
        <span className="sectionLabel">Tools</span>
        <div className="menuItem highlight"><FaRegEdit /> Editor</div>
        <div className="menuItem"><FaBookmark /> Bookmarks</div>
      </div>

      {/* Chat History */}
      <div className="section">
        <div className="chatHistory"><FaHistory /> Chat History</div>
        <div className="chatItem">Lorem ipsum dolor sit amet consectetur.</div>
        <div className="chatItem">Lorem ipsum dolor sit amet consectetur.</div>
        <div className="chatItem">Lorem ipsum dolor sit amet consectetur.</div>
        <a href="#" className="viewMore">View more</a>
      </div>
    </div>


      {/* Main content area with editor and thumbnails */}
      <div style={{ flex: '1 1 auto', display: 'flex', padding: '24px', overflowY: 'auto' }}>
        <div style={{ flex: '1 1 auto', paddingRight: '16px' }}>
          <div style={{ backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '16px' }}>
            <MenuBar onInsertBreak={insertBreakRef.current ? insertBreakRef.current.insertBreak : () => {}} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>Document Name.docx</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ backgroundColor: '#e9ecef', padding: '6px 12px', borderRadius: '2px', border: 'round', cursor: 'pointer' }}>Header & Footer</button>
                <button style={{ backgroundColor: '#e9ecef', padding: '6px 12px', borderRadius: '2px', border: 'round', cursor: 'pointer' }}>Margin</button>
                <button style={{ backgroundColor: '#e9ecef', padding: '6px 12px', borderRadius: '2px', border: 'round', cursor: 'pointer' }}>Rulers</button>
              </div>
            </div>
            <CustomEditor ref={insertBreakRef} />
          </div>
        </div>



        {/* Thumbnail bonus on the right */}


    <div className="pdfPreviewContainer">
      {/* Tabs */}
      <div className="tabs">
        <span className="tab active">Thumbnail</span>
        <span className="tab">Index</span>
        <span className="tab">Search</span>
      </div>

      {/* Thumbnails */}
      <div className="thumbnails">
        <div className="thumbnailPage">
          <div className="pdfBox">
            <h3>PDF</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            <ul>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Lorem ipsum dolor sit amet.</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          </div>
        </div>

        <div className="thumbnailPage">
          <div className="pdfBox">
            <h3>PDF</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            <ul>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Lorem ipsum dolor sit amet.</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          </div>
        </div>

        <div className="thumbnailPage">
          <div className="pdfBox">
            <h3>PDF</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            <ul>
              <li>Lorem ipsum dolor sit amet.</li>
              <li>Lorem ipsum dolor sit amet.</li>
            </ul>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          </div>
        </div>
      </div>

      <form className="askBox">
        <input type="text" placeholder = "Ask Vettam..." />
        <button className="sendBtn" type = "submit"><FaPaperPlane/></button>
      </form>


    </div>

      </div>
    </div>
  );
};

export default App;