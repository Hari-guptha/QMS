import templateService from './template.service';
import { sendMail } from './smtpTransporter';

export async function sendTemplateEmail(to: string, subject: string, templateName: string, data: Record<string, any>, from?: { name?: string; email?: string }) {
  const html = await templateService.render(templateName, data);
  const fromLine = from?.email ? `"${from.name || ''}" <${from.email}>` : undefined;
  const mailOptions: any = {
    from: fromLine || undefined,
    to,
    subject,
    html,
  };
  return sendMail(mailOptions);
}

export async function sendSimpleEmail(to: string, subject: string, body: string, from?: { name?: string; email?: string }) {
  const fromLine = from?.email ? `"${from.name || ''}" <${from.email}>` : undefined;
  return sendMail({ from: fromLine, to, subject, html: body, text: body });
}
