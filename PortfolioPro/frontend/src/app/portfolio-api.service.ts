import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Account, Credentials, Stock, TradeRequest, Transaction } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly sessionOptions = { withCredentials: true };

  signup(credentials: Credentials): Promise<Account> {
    return firstValueFrom(this.http.post<Account>(`${this.baseUrl}/auth/signup`, credentials, this.sessionOptions));
  }

  login(credentials: Credentials): Promise<Account> {
    return firstValueFrom(this.http.post<Account>(`${this.baseUrl}/auth/login`, credentials, this.sessionOptions));
  }

  currentUser(): Promise<Account | null> {
    return firstValueFrom(this.http.get<Account | null>(`${this.baseUrl}/auth/me`, this.sessionOptions));
  }

  logout(): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/auth/logout`, {}, this.sessionOptions));
  }

  getStocks(): Promise<Stock[]> {
    return firstValueFrom(this.http.get<Stock[]>(`${this.baseUrl}/stocks`, this.sessionOptions));
  }

  getPortfolio(): Promise<Transaction[]> {
    return firstValueFrom(this.http.get<Transaction[]>(`${this.baseUrl}/trade/portfolio`, this.sessionOptions));
  }

  executeTrade(request: TradeRequest): Promise<Transaction> {
    return firstValueFrom(this.http.post<Transaction>(`${this.baseUrl}/trade`, request, this.sessionOptions));
  }
}
