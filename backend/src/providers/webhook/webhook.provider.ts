import { createHmac } from 'crypto';
import { getConfig } from '../../config';
import { getLogger } from '../../config/logger';

export interface WebhookPayload {
  event: string;
  organizationId: string;
  data: Record<string, unknown>;
}

export class WebhookProvider {
  async dispatch(url: string, payload: WebhookPayload): Promise<void> {
    const config = getConfig();
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.WEBHOOK_SIGNING_SECRET) {
      const signature = createHmac('sha256', config.WEBHOOK_SIGNING_SECRET)
        .update(body)
        .digest('hex');
      headers['X-Hiring-Signature'] = signature;
    }

    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      getLogger().warn({ url, status: response.status }, 'Webhook delivery failed');
      throw new Error(`Webhook failed with status ${response.status}`);
    }
  }
}

export const webhookProvider = new WebhookProvider();
