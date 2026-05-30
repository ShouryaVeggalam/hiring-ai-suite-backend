export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface IEmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}
