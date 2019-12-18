import { Component, OnInit, Input } from '@angular/core';
import { Web3Service } from '../../../util/web3.service';
import { IRequestData } from '@requestnetwork/request-network.js';
import { UtilService } from '../../../util/util.service';

@Component({
  selector: 'app-rnf-invoice-request',
  templateUrl: './rnf-invoice.component.html',
  styleUrls: ['./rnf-invoice.component.scss'],
})
export class RnfInvoiceComponent implements OnInit {
  @Input()
  request: IRequestData;

  @Input()
  blockchainName: string;

  account: string;
  amount: string;

  public invoiceItemsColumns = [
    'name',
    'unitPrice',
    'quantity',
    'discount',
    //'discountPercent', // TODO remove if sure
    'taxPercent',
  ];

  data: any;
  taxFreeTotal;
  vatTotal;
  totalWithTax;

  constructor(
    public web3Service: Web3Service,
    private utilService: UtilService
  ) {}

  ngOnInit() {
    this.data = this.request.data.data;
    this.updateTotals();
    this.amount = this.web3Service.BNToAmount(
      this.request.payee.expectedAmount,
      this.request.currency
    );

    this.watchAccount();
  }

  getTaxFreeTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .BN(item.unitPrice)
            // Data format versions 0.0.1 & 0.0.2
            .sub(this.web3Service.BN(item.discount || 0))
            .mul(this.web3Service.BN(item.quantity))
            // Data format versions 0.0.3+
            .mul(
              this.web3Service.BN(
                Math.round(
                  10000 -
                    (item.discountPercent ? item.discountPercent : 0) * 100
                )
              )
            )
            .div(this.web3Service.BN(10000))
        ),
      this.web3Service.BN()
    );
  }

  watchAccount() {
    // reload requestObject with its web3 if account has changed
    this.web3Service.accountObservable.subscribe(account => {
      this.account = account;
    });
  }

  getVatTotal() {
    return this.data['invoiceItems'].reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .BN(item.unitPrice)
            // Data format versions 0.0.1 & 0.0.2
            .sub(this.web3Service.BN(item.discount || 0))
            .mul(this.web3Service.BN(item.quantity))
            // Data format versions 0.0.3+
            .mul(
              this.web3Service.BN(
                Math.round(
                  10000 -
                    (item.discountPercent ? item.discountPercent : 0) * 100
                )
              )
            )
            .div(this.web3Service.BN(10000))
            .mul(this.web3Service.BN(Math.round(item.taxPercent * 100)))
            .div(this.web3Service.BN(10000))
        ),
      this.web3Service.BN()
    );
  }

  updateTotals() {
    if (!this.data['invoiceItems'] || !this.web3Service.web3Ready) {
      this.taxFreeTotal = null;
      this.vatTotal = null;
      this.totalWithTax = null;
    }
    if (this.data['meta']['version'] === '0.0.1') {
      this.updateTotalsV001();
      return;
    }
    this.taxFreeTotal = this.getTaxFreeTotal();
    this.vatTotal = this.getVatTotal();
    this.totalWithTax = this.taxFreeTotal.add(this.vatTotal);
  }

  itemAmount(unitPrice, discountOrDiscPercent, quantity) {
    if (!this.web3Service.web3Ready) {
      return '0';
    }
    if (this.data['meta']['version'] === '0.0.1') {
      const discount = discountOrDiscPercent;
      return this.web3Service.BNToAmount(
        this.web3Service
          .amountToBN(unitPrice.toString(), this.request.currency)
          .sub(
            this.web3Service.amountToBN(
              discount ? discount.toString() : '0',
              this.request.currency
            )
          )
          .mul(this.web3Service.BN(quantity)),
        this.request.currency
      );
    }

    if (this.data['meta']['version'] === '0.0.2') {
      const discount = discountOrDiscPercent;
      return this.web3Service.BNToAmount(
        this.web3Service
          .BN(unitPrice)
          .sub(this.web3Service.BN(discount || 0))
          .mul(this.web3Service.BN(quantity)),
        this.request.currency
      );
    }

    const discountPercent = discountOrDiscPercent;
    return this.web3Service.BNToAmount(
      this.web3Service
        .BN(unitPrice)
        .mul(this.web3Service.BN(quantity))
        .mul(
          this.web3Service.BN(
            Math.round(10000 - (discountPercent ? discountPercent : 0) * 100)
          )
        )
        .div(this.web3Service.BN(10000)),
      this.request.currency
    );
  }

  updateTotalsV001() {
    this.taxFreeTotal = this.web3Service.amountToBN(
      this.data['invoiceItems']
        .reduce(
          (acc, item) =>
            acc + item.quantity * (item.unitPrice - (item.discount || 0)), // V0.0.1
          0
        )
        .toString(),
      this.request.currency
    );
    this.vatTotal = this.web3Service.amountToBN(
      this.data['invoiceItems']
        .reduce(
          (acc, item) =>
            acc +
            item.quantity *
            (item.unitPrice - (item.discount || 0)) * // V0.0.1
              (item.taxPercent * 0.01),
          0
        )
        .toString(),
      this.request.currency
    );
    this.totalWithTax = this.taxFreeTotal.add(this.vatTotal);
  }
}
