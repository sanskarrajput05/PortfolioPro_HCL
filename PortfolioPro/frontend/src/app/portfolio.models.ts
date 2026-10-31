export interface Account {
  id: number;
  username: string;
  name: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
}

export interface Transaction {
  id: number;
  symbol: string;
  quantity: number;
  type: 'BUY' | 'SELL';
  executionPrice: number | null;
  timestamp: string;
}

export interface TradeRequest {
  symbol: string;
  quantity: number;
  type: 'BUY' | 'SELL';
}

export interface Position {
  symbol: string;
  quantity: number;
  averageCost: number;
  stock: Stock | undefined;
}

export interface MarketIndex {
  name: string;
  value: number;
  exchange: string;
}
