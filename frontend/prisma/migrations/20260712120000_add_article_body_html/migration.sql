-- Add rich-text (WYSIWYG) HTML body alongside the existing Markdown body.
-- Additive & non-destructive: existing articles keep bodyMarkdown; new/edited
-- articles store sanitized HTML in bodyHtml (public page falls back to markdown
-- when bodyHtml is empty).
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "bodyHtml" TEXT NOT NULL DEFAULT '';
