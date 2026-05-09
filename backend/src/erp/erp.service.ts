import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

const ERP_PMN_URL = process.env.ERP_PMN_URL ?? 'http://erp-pmn-app:3000';
const ERP_USER = process.env.ERP_PMN_API_USER ?? '';
const ERP_PASS = process.env.ERP_PMN_API_PASSWORD ?? '';

export interface ErpCustomer {
  id: number;
  externalId?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface ErpProduct {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  basePrice?: number | null;
}

export interface ErpLicense {
  id: number;
  customerId: number;
  productId: number;
  licenseKey: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ErpOrder {
  id: number;
  ref: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

/**
 * Read-mostly client for the erp-pmn Next.js API.
 *
 * Authenticates as a service account via the same NextAuth credentials
 * endpoint that the ERP UI uses. The session cookie returned in the response
 * is cached and replayed on subsequent requests, refreshed automatically when
 * a request returns 401.
 *
 * All public methods degrade gracefully on failure (return empty / throw a
 * tagged error) so the profile UI keeps rendering even when the ERP is down
 * or the service account is not yet provisioned.
 */
@Injectable()
export class ErpService implements OnModuleInit {
  private readonly logger = new Logger(ErpService.name);
  private cookie: string | null = null;
  private cookieFetchedAt = 0;
  private readonly cookieTtlMs = 1000 * 60 * 60 * 12; // 12h refresh
  private configured = false;

  onModuleInit() {
    this.configured =
      Boolean(ERP_USER) && Boolean(ERP_PASS) && ERP_PMN_URL.length > 0;
    if (!this.configured) {
      this.logger.warn(
        'ErpService not configured (ERP_PMN_API_USER/PASSWORD missing). ' +
          'Profile pages will show empty ERP data until provisioned.',
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Hit erp-pmn /api/auth/csrf then /api/auth/callback/credentials to obtain
   * a NextAuth session cookie. Returns the Cookie header value or null.
   */
  private async login(): Promise<string | null> {
    if (!this.configured) return null;
    try {
      const csrfRes = await fetch(`${ERP_PMN_URL}/api/auth/csrf`, {
        cache: 'no-store',
      });
      if (!csrfRes.ok) {
        this.logger.warn(`erp csrf failed (HTTP ${csrfRes.status})`);
        return null;
      }
      const csrfCookies = csrfRes.headers.get('set-cookie') ?? '';
      const csrfBody = (await csrfRes.json()) as { csrfToken?: string };
      const csrfToken = csrfBody.csrfToken;
      if (!csrfToken) return null;

      const form = new URLSearchParams();
      form.set('csrfToken', csrfToken);
      form.set('email', ERP_USER);
      form.set('password', ERP_PASS);
      form.set('callbackUrl', '/');
      form.set('json', 'true');

      const loginRes = await fetch(
        `${ERP_PMN_URL}/api/auth/callback/credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            cookie: csrfCookies,
          },
          body: form.toString(),
          redirect: 'manual',
          cache: 'no-store',
        },
      );

      const setCookie = loginRes.headers.get('set-cookie');
      if (!setCookie) {
        this.logger.warn('erp login: no set-cookie header in response');
        return null;
      }
      // Combine the relevant cookies into a single Cookie header value
      return setCookie
        .split(/, (?=[A-Za-z0-9_-]+=)/)
        .map((c) => c.split(';')[0])
        .join('; ');
    } catch (e) {
      this.logger.warn(
        `erp login error: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  private async ensureCookie(force = false): Promise<string | null> {
    const fresh = Date.now() - this.cookieFetchedAt < this.cookieTtlMs;
    if (this.cookie && fresh && !force) return this.cookie;
    this.cookie = await this.login();
    this.cookieFetchedAt = Date.now();
    return this.cookie;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    pathname: string,
    body?: unknown,
  ): Promise<T | null> {
    if (!this.configured) return null;
    let cookie = await this.ensureCookie(false);
    if (!cookie) return null;
    const url = `${ERP_PMN_URL}${pathname}`;
    const send = async (cookieHeader: string) => {
      return fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          cookie: cookieHeader,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    };
    let res = await send(cookie);
    if (res.status === 401) {
      // Token expired — try once with a fresh cookie
      cookie = await this.ensureCookie(true);
      if (!cookie) return null;
      res = await send(cookie);
    }
    if (!res.ok) {
      this.logger.warn(`erp ${method} ${pathname} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  }

  async syncCustomer(input: {
    userId: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  }): Promise<ErpCustomer | null> {
    // erp-pmn doesn't yet have /api/customers/sync. Try GET-by-email then PATCH/POST.
    const externalId = `pmn-${input.userId}`;
    const search = await this.request<{ items: ErpCustomer[] }>(
      'GET',
      `/api/customers?search=${encodeURIComponent(input.email)}`,
    );
    const existing = search?.items?.find((c) => c.email === input.email);
    if (existing) {
      return existing;
    }
    // Fall back to creating a new Customer (org type) — best effort.
    const created = await this.request<ErpCustomer>('POST', '/api/customers', {
      type: 'INDIVIDUAL',
      name:
        input.displayName ??
        [input.firstName, input.lastName].filter(Boolean).join(' ') ??
        input.email,
      email: input.email,
      externalId,
      externalSource: 'pmndigital',
    });
    return created;
  }

  async getCustomerOrders(customerId: number | null): Promise<ErpOrder[]> {
    if (!customerId) return [];
    const data = await this.request<{ items: ErpOrder[] }>(
      'GET',
      `/api/quotations?customerId=${customerId}`,
    );
    return data?.items ?? [];
  }

  async getProducts(): Promise<ErpProduct[]> {
    const data = await this.request<{ items: ErpProduct[] }>(
      'GET',
      '/api/products',
    );
    return data?.items ?? [];
  }

  async getCustomerLicenses(customerId: number | null): Promise<ErpLicense[]> {
    if (!customerId) return [];
    // The /api/licenses endpoint will be added in a future erp-pmn PR.
    // Until then we return an empty array so the products page renders cleanly.
    const data = await this.request<{ items: ErpLicense[] }>(
      'GET',
      `/api/licenses?customerId=${customerId}`,
    );
    return data?.items ?? [];
  }
}
