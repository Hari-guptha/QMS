import fs from 'fs';
import path from 'path';

class TemplateService {
  private templateCache = new Map<string, string>();
  private TEMPLATE_DIR = path.join(process.cwd(), 'src', 'notification', 'templates', 'emails');

  async render(templateName: string, data: Record<string, any>): Promise<string> {
    const tpl = await this.loadTemplate(templateName);
    return this.replacePlaceholders(tpl, data);
  }

  private async loadTemplate(name: string): Promise<string> {
    if (this.templateCache.has(name)) return this.templateCache.get(name)!;
    const p = path.join(this.TEMPLATE_DIR, name + '.html');
    if (!fs.existsSync(p)) return '';
    const content = fs.readFileSync(p, 'utf-8');
    this.templateCache.set(name, content);
    return content;
  }

  private replacePlaceholders(template: string, data: Record<string, any>) {
    let result = template;
    for (const [k, v] of Object.entries(data)) {
      const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      result = result.replace(re, String(v ?? ''));
    }
    return result;
  }
}

export default new TemplateService();
