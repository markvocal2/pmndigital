/**
 * Shared Tailwind styling for rendered article-body HTML. Used by BOTH the
 * public article page (app/blog/[slug]/page.tsx) and the WYSIWYG editor content
 * area (components/admin/RichTextEditor.tsx) so the editor is truly what-you-see.
 * Uses arbitrary `[&_tag]:` variants (no @tailwindcss/typography in this project).
 * text-align inline styles emitted by the editor apply natively — no class needed.
 */
export const ARTICLE_BODY_CLASS = [
  'text-[17px] leading-[1.92] text-[#CBD3E1]',
  '[&_a]:text-blue-300 [&_a]:underline',
  '[&_strong]:text-white [&_strong]:font-semibold',
  '[&_u]:underline [&_s]:line-through',
  '[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-[32px] [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-white',
  '[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white',
  '[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-100',
  '[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-slate-100',
  '[&_h5]:mb-1.5 [&_h5]:mt-5 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-slate-200',
  '[&_h6]:mb-1.5 [&_h6]:mt-5 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:text-slate-300',
  '[&_p]:mb-5',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_li]:ml-5',
  '[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400',
  '[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[14px]',
  '[&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_img]:my-6 [&_img]:block [&_img]:mx-auto [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg',
  '[&_video]:my-6 [&_video]:block [&_video]:mx-auto [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg [&_video]:bg-black',
  '[&_figure]:my-6 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-400',
  '[&_hr]:my-8 [&_hr]:border-white/10',
].join(' ');
