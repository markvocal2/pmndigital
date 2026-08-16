'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Video } from './tiptapVideo';
import { isVideoUrl } from '@/lib/cms';
import { uploadMediaAction } from '@/lib/cms-actions';
import { MediaPicker } from './MediaPicker';
import { ARTICLE_BODY_CLASS } from '@/lib/articleBodyClass';

/* ---- toolbar button ---- */
function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-[13px] font-semibold transition',
        active ? 'bg-blue-500/90 text-white' : 'text-slate-300 hover:bg-white/10',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px self-center bg-white/10" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Uploads and the media library both land here: a clip has to become a <video> node,
  // not an <img> pointed at an .mp4.
  const insertMedia = useCallback((url: string) => {
    if (!url) return;
    if (isVideoUrl(url)) {
      editor.chain().focus().insertContent({ type: 'video', attrs: { src: url } }).run();
    } else {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { alert('ไฟล์ใหญ่เกินไป — สูงสุด 200MB'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadMediaAction(fd);
      if (res.ok) insertMedia(res.data.url);
      else alert(res.error);
    } finally {
      setBusy(false);
    }
  }, [insertMedia]);

  const setLink = useCallback(() => {
    if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
    const prev = (editor.getAttributes('link').href as string) || '';
    const url = window.prompt('ใส่ลิงก์ (URL):', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const headingValue = (() => {
    for (let l = 1 as 1 | 2 | 3 | 4 | 5 | 6; l <= 6; l = (l + 1) as 1 | 2 | 3 | 4 | 5 | 6) {
      if (editor.isActive('heading', { level: l })) return String(l);
    }
    return 'p';
  })();

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-white/10 bg-[#0b1020] p-1.5">
      <Btn title="เลิกทำ (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↶</Btn>
      <Btn title="ทำซ้ำ (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↷</Btn>
      <Sep />

      {/* headings / paragraph */}
      <select
        title="ระดับหัวข้อ"
        value={headingValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }}
        className="mr-1 h-8 rounded-md border border-white/10 bg-[#0b1020] px-2 text-[13px] text-slate-200 outline-none"
      >
        <option value="p" className="bg-[#0b1020]">ย่อหน้า</option>
        <option value="1" className="bg-[#0b1020]">หัวข้อ H1</option>
        <option value="2" className="bg-[#0b1020]">หัวข้อ H2</option>
        <option value="3" className="bg-[#0b1020]">หัวข้อ H3</option>
        <option value="4" className="bg-[#0b1020]">หัวข้อ H4</option>
        <option value="5" className="bg-[#0b1020]">หัวข้อ H5</option>
        <option value="6" className="bg-[#0b1020]">หัวข้อ H6</option>
      </select>
      <Sep />

      {/* inline marks */}
      <Btn title="ตัวหนา (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
      <Btn title="ตัวเอียง (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
      <Btn title="ขีดเส้นใต้ (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>
      <Btn title="ขีดฆ่า" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <Btn title="โค้ด" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{'</>'}</Btn>
      <Sep />

      {/* alignment */}
      <Btn title="ชิดซ้าย" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⯇</Btn>
      <Btn title="กึ่งกลาง" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</Btn>
      <Btn title="ชิดขวา" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>⯈</Btn>
      <Sep />

      {/* blocks */}
      <Btn title="รายการหัวข้อ" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</Btn>
      <Btn title="รายการลำดับ" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</Btn>
      <Btn title="อ้างอิง (quote)" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</Btn>
      <Btn title="บล็อกโค้ด" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'{ }'}</Btn>
      <Btn title="เส้นคั่น" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</Btn>
      <Sep />

      {/* link + image */}
      <Btn title="ลิงก์" active={editor.isActive('link')} onClick={setLink}>🔗</Btn>
      <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onFile} />
      <Btn title="แทรกรูป/วิดีโอ (อัปโหลด)" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? '…' : '🖼️'}</Btn>
      <Btn title="แทรกจากคลังสื่อ" onClick={() => setPick(true)}>คลัง</Btn>

      <MediaPicker open={pick} onClose={() => setPick(false)} onPick={insertMedia} />
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // avoid Next.js SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false }),
      Video,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: `${ARTICLE_BODY_CLASS} min-h-[360px] rounded-b-md border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-blue-400/60`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Re-render the toolbar on every transaction so active states stay in sync.
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => force((n) => n + 1);
    editor.on('transaction', bump);
    return () => { editor.off('transaction', bump); };
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[400px] rounded-md border border-white/10 bg-white/[0.03]" />;
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
