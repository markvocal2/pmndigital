import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AiService } from '../ai/ai.service';
import type { IntegrationsService } from '../ai/integrations.service';

export interface McpDeps {
  ai: AiService;
  integrations: IntegrationsService;
}

/** Build a fresh MCP server with the PMN Digital tool catalog (Phase 2 starter set). */
export function buildMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({ name: 'pmndigital', version: '1.0.0' });

  server.registerTool(
    'list_ai_providers',
    {
      title: 'รายการผู้ให้บริการ AI',
      description: 'แสดงผู้ให้บริการ AI ที่ตั้งค่าไว้ (Claude/Gemini/OpenAI) พร้อมสถานะการเชื่อมต่อ',
      inputSchema: {},
    },
    async () => {
      const items = await deps.integrations.listStatus();
      return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
    },
  );

  server.registerTool(
    'ai_health',
    {
      title: 'ตรวจสถานะ AI',
      description: 'ตรวจว่า Claude และ Gemini พร้อมใช้งานฝั่งเซิร์ฟเวอร์หรือไม่',
      inputSchema: {},
    },
    async () => {
      const [anthropic, gemini] = await Promise.all([deps.ai.anthropicReady(), deps.ai.geminiReady()]);
      return { content: [{ type: 'text', text: JSON.stringify({ anthropic, gemini }) }] };
    },
  );

  server.registerTool(
    'draft_article',
    {
      title: 'ร่างบทความด้วย Claude',
      description: 'ร่างบทความภาษาไทยจากหัวข้อโดยใช้ Claude — คืนข้อความ Markdown (ยังไม่บันทึกลงระบบ)',
      inputSchema: {
        topic: z.string().describe('หัวข้อหรือประเด็นของบทความ'),
        tone: z.string().optional().describe('โทนการเขียน เช่น มืออาชีพ / เป็นกันเอง'),
        words: z.number().optional().describe('ความยาวโดยประมาณเป็นจำนวนคำ (ค่าเริ่มต้น 600)'),
      },
    },
    async ({ topic, tone, words }) => {
      const text = await deps.ai.generateText({
        system:
          "คุณเป็นนักเขียนคอนเทนต์การตลาดของ PMN Digital เขียนภาษาไทยที่เป็นธรรมชาติ อ่านลื่น ไม่ใส่ช่องไฟ (letter-spacing) แปลก ๆ และไม่ใช้สำนวนที่ดูเป็น AI",
        prompt: `เขียนร่างบทความเรื่อง "${topic}"${tone ? ` ด้วยโทน ${tone}` : ''} ความยาวประมาณ ${
          words ?? 600
        } คำ ให้มีโครงสร้าง: หัวเรื่อง, เกริ่นนำ, หัวข้อย่อยพร้อมเนื้อหา, และบทสรุป ตอบกลับเป็น Markdown ล้วน`,
        maxTokens: 4000,
      });
      return { content: [{ type: 'text', text }] };
    },
  );

  server.registerTool(
    'generate_image',
    {
      title: 'สร้างภาพด้วย Gemini',
      description: 'สร้างภาพจากคำอธิบายด้วย Gemini (Imagen) แล้วอัปโหลดขึ้น PMN Drive — คืน URL รูปบน CDN',
      inputSchema: {
        prompt: z.string().describe('คำอธิบายภาพที่ต้องการ (เขียนเป็นภาษาอังกฤษมักได้ผลดีที่สุด)'),
      },
    },
    async ({ prompt }) => {
      const { url } = await deps.ai.generateImageToDrive(prompt);
      return { content: [{ type: 'text', text: url }] };
    },
  );

  return server;
}
