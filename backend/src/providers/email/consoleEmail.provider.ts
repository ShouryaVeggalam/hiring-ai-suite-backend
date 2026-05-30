import { getLogger } from '../../config/logger';
import type { EmailMessage, IEmailProvider } from './IEmailProvider';

export class ConsoleEmailProvider implements IEmailProvider {
  readonly name = 'console';

  async send(message: EmailMessage): Promise<void> {
    getLogger().info({ to: message.to, subject: message.subject }, 'Email (console)');
  }
}
