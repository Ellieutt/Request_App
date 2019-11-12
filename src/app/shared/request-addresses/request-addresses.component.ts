import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'request-addresses',
  templateUrl: './request-addresses.component.html',
  styleUrls: ['./request-addresses.component.scss'],
})
export class RequestAddressesComponent implements OnInit {
  @Input()
  request: any;
  @Input()
  account: string;
  payer: string;
  currency: string;
  max: number = 0;
  min: number = 0;

  payees: any;
  constructor() {}

  ngOnInit() {
    // signed request
    if (!this.request.payee) {
      this.payees = this.request.payeesIdAddress.map((id, i) => {
        const paymentAddress = this.request.payeesPaymentAddress[i];
        return {
          id,
          payment: paymentAddress === id ? null : paymentAddress,
        };
      });
    } else {
      const id = this.request.payee.address;
      const paymentAddress = this.request.currencyContract.payeePaymentAddress;
      this.payees = [
        {
          id,
          payment: paymentAddress === id ? null : paymentAddress,
        },
      ];
      this.payer = this.request.payer;
    }
    this.currency = this.request.currency;
  }

  getNextPayees(init) {
    if (init) {
      this.max = 0;
    }
    if (this.payees.length <= 5) {
      this.max += this.payees.length;
    } else {
      this.min = this.max;
      if (this.payees.length - this.max >= 5) {
        this.max += 5;
      } else {
        this.max += this.payees.length - this.max;
      }
    }
  }
  seeOnlyMainPayee() {
    this.min = 0;
    this.max = 0;
  }
  getLastPayees() {
    this.min = this.min - 5;
    if (this.max % 5 !== 0) {
      this.max = this.max - (this.max % 5);
    } else {
      this.max = this.max - 5;
    }
  }

  get blockchainName(): string {
    return this.currency === 'BTC' ? 'BTC' : 'ETH';
  }
}
