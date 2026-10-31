import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Account, Credentials, MarketIndex, Position, Stock, Transaction } from './portfolio.models';
import { PortfolioApiService } from './portfolio-api.service';

type AuthMode = 'login' | 'signup';
type WorkspaceTab = 'market' | 'holdings' | 'orders';
type TradeType = 'BUY' | 'SELL';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private readonly api = inject(PortfolioApiService);
  private readonly moneyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
  private readonly indexFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly account = signal<Account | null>(null);
  readonly authChecked = signal(false);
  readonly authMode = signal<AuthMode>('login');
  readonly authError = signal('');
  readonly authBusy = signal(false);
  readonly stocks = signal<Stock[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly dashboardBusy = signal(false);
  readonly dashboardError = signal('');
  readonly tradeError = signal('');
  readonly notice = signal('');
  readonly activeTab = signal<WorkspaceTab>('market');
  readonly credentials: Credentials = { username: '', password: '' };
  trade = { symbol: '', quantity: '1', type: 'BUY' as TradeType };

  readonly tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'market', label: 'Market' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'orders', label: 'Orders' },
  ];
  readonly tradeTypes: TradeType[] = ['BUY', 'SELL'];
  readonly marketIndices: MarketIndex[] = [
    { name: 'NIFTY 50', value: 24850.5, exchange: 'NSE' },
    { name: 'SENSEX', value: 81300.75, exchange: 'BSE' },
  ];

  readonly heldPositions = computed<Position[]>(() => {
    const positions = new Map<string, { quantity: number; cost: number }>();
    for (const transaction of this.transactions()) {
      const position = positions.get(transaction.symbol) ?? { quantity: 0, cost: 0 };
      const quantity = Number(transaction.quantity);
      const direction = transaction.type === 'BUY' ? 1 : -1;
      position.quantity += direction * quantity;
      position.cost += direction * quantity * Number(transaction.executionPrice ?? 0);
      positions.set(transaction.symbol, position);
    }

    return [...positions.entries()]
      .filter(([, position]) => position.quantity > 0)
      .map(([symbol, position]) => ({
        symbol,
        quantity: position.quantity,
        averageCost: position.cost / position.quantity,
        stock: this.stocks().find(stock => stock.symbol === symbol),
      }));
  });

  readonly portfolioValue = computed(() => this.heldPositions().reduce(
    (sum, position) => sum + position.quantity * Number(position.stock?.currentPrice ?? 0),
    0,
  ));

  get signingUp(): boolean {
    return this.authMode() === 'signup';
  }

  ngOnInit(): void {
    void this.restoreSession();
  }

  formatMoney(value: number | string | null | undefined): string {
    return this.moneyFormatter.format(Number(value ?? 0));
  }

  formatIndex(value: number): string {
    return this.indexFormatter.format(value);
  }

  quantityValue(): number {
    return Number(this.trade.quantity || 0);
  }

  selectedStock(): Stock | undefined {
    return this.stocks().find(stock => stock.symbol === this.trade.symbol);
  }

  selectTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab);
  }

  selectStock(stock: Stock): void {
    this.trade = { ...this.trade, symbol: stock.symbol, type: 'BUY' };
    this.tradeError.set('');
  }

  selectTradeType(type: TradeType): void {
    this.trade = { ...this.trade, type };
    this.tradeError.set('');
  }

  switchAuthMode(): void {
    this.authMode.update(mode => mode === 'signup' ? 'login' : 'signup');
    this.authError.set('');
  }

  async handleAuth(): Promise<void> {
    this.authBusy.set(true);
    this.authError.set('');
    try {
      const response = this.signingUp
        ? await this.api.signup(this.credentials)
        : await this.api.login(this.credentials);
      this.account.set(response);
      this.credentials.username = '';
      this.credentials.password = '';
      this.activeTab.set('market');
      await this.loadDashboard();
    } catch (error: unknown) {
      this.authError.set(this.getErrorMessage(error, 'Could not sign in. Check the backend and try again.'));
    } finally {
      this.authBusy.set(false);
    }
  }

  async handleLogout(): Promise<void> {
    try {
      await this.api.logout();
    } finally {
      this.account.set(null);
      this.stocks.set([]);
      this.transactions.set([]);
      this.notice.set('');
    }
  }

  async handleTrade(): Promise<void> {
    this.tradeError.set('');
    this.notice.set('');
    try {
      const transaction = await this.api.executeTrade({
        symbol: this.trade.symbol,
        quantity: this.quantityValue(),
        type: this.trade.type,
      });
      this.transactions.update(current => [transaction, ...current]);
      this.trade = { ...this.trade, quantity: '1' };
      this.notice.set(`${transaction.type} order recorded for ${transaction.quantity} ${transaction.symbol} share${transaction.quantity === 1 ? '' : 's'}.`);
      this.activeTab.set('orders');
    } catch (error: unknown) {
      this.tradeError.set(this.getErrorMessage(error, 'The order could not be completed.'));
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const account = await this.api.currentUser();
      if (account) {
        this.account.set(account);
        await this.loadDashboard();
      }
    } catch {
      this.account.set(null);
    } finally {
      this.authChecked.set(true);
    }
  }

  private async loadDashboard(): Promise<void> {
    this.dashboardBusy.set(true);
    this.dashboardError.set('');
    try {
      const [stocks, transactions] = await Promise.all([
        this.api.getStocks(),
        this.api.getPortfolio(),
      ]);
      this.stocks.set(stocks);
      this.transactions.set(transactions);
      if (stocks.length && !this.trade.symbol) {
        this.trade = { ...this.trade, symbol: stocks[0].symbol };
      }
    } catch (error: unknown) {
      this.dashboardError.set(this.getErrorMessage(error, 'Could not load your portfolio data.'));
    } finally {
      this.dashboardBusy.set(false);
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
      const body = error.error as { detail?: unknown; message?: unknown };
      if (typeof body.detail === 'string') return body.detail;
      if (typeof body.message === 'string') return body.message;
    }
    return fallback;
  }
}
