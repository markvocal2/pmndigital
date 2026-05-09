import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: {
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentIntent>;
  getStatus(id: string): Promise<PaymentIntent['status']>;
}

class MockProvider implements PaymentProvider {
  readonly name = 'mock';

  createIntent(input: {
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentIntent> {
    const id = `mock_${randomBytes(8).toString('hex')}`;
    return Promise.resolve({
      id,
      amount: input.amount,
      currency: input.currency,
      status: 'pending',
      metadata: input.metadata,
    });
  }

  getStatus(id: string): Promise<PaymentIntent['status']> {
    // Mock provider always reports pending; real providers would query the API
    return Promise.resolve(id.startsWith('mock_') ? 'pending' : 'failed');
  }
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;

  constructor() {
    const choice = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();
    if (choice !== 'mock') {
      this.logger.warn(
        `Unknown PAYMENT_PROVIDER=${choice}; falling back to mock provider`,
      );
    }
    this.provider = new MockProvider();
  }

  listPaymentMethods(userId: number) {
    return Promise.resolve({
      provider: this.provider.name,
      methods: [],
      comingSoon: true,
      userId,
    });
  }

  createIntent(amount: number, currency: string, userId: number) {
    return this.provider.createIntent({
      amount,
      currency,
      metadata: { userId },
    });
  }
}
