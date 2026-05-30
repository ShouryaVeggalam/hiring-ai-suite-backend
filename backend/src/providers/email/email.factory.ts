import { getConfig } from '../../config';
import { ConsoleEmailProvider } from './consoleEmail.provider';
import type { IEmailProvider } from './IEmailProvider';

export function createEmailProvider(): IEmailProvider {
  const config = getConfig();
  if (config.EMAIL_PROVIDER === 'smtp') {
    // SMTP provider can be wired when credentials are configured
    return new ConsoleEmailProvider();
  }
  return new ConsoleEmailProvider();
}
