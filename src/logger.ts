export class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  info(message: string): void {
    console.log(`${this.prefix}${message}`);
  }

  error(message: string, error?: unknown): void {
    console.error(`${this.prefix}${message}`, error || '');
  }

  debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      console.debug(`${this.prefix}${message}`);
    }
  }
} 