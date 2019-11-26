import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'currency-converter',
  templateUrl: './currency-converter.component.html',
  styleUrls: ['./currency-converter.component.scss'],
})
export class CurrencyConverterComponent implements OnInit {
  @Input()
  public from: string;
  @Input()
  public to: string;
  @Input()
  public timestamp: string;
  @Input()
  public amount: number;
  public rate: number;
  public get value(): number {
    return this.rate * this.amount;
  }

  isEditable(): boolean {
    return !this.from || !this.to;
  }

  private async updateRate() {
    if (!(this.from && this.to)) {
      this.rate = null;
      return;
    }

    const currency = this.from == 'SAI' ? 'DAI' : this.from;
    if (this.timestamp) {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/dayAvg?fsym=${currency}&tsym=${
          this.to
        }&toTs=${this.timestamp}`
      );
      const result = (await response.json())[this.to];
      this.rate = result;
    } else {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=${
          this.to
        }`
      );
      const result = (await response.json())[this.to];
      this.rate = result;
    }
  }

  constructor() {}

  ngOnInit() {
    this.updateRate();
  }
}
