import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import * as moment from 'moment';
// import RequestNetworkDataFormat from 'requestnetwork-data-format';
import { Web3Service } from '../../util/web3.service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'app-advanced-invoice',
  templateUrl: './advanced-invoice.component.html',
  styleUrls: ['./advanced-invoice.component.scss'],
  animations: [
    trigger('displayAnim', [
      transition(':enter', [
        style({
          overflow: 'hidden',
          'min-height': 52,
          'max-height': 0,
          opacity: 0,
          transform: 'scale(0.5)',
        }),
        animate(
          '0.7s cubic-bezier(.8, -0.6, 0.26, 1.6)',
          style({
            overflow: 'visible',
            'max-height': 1000,
            opacity: 1,
            transform: 'scale(1)',
          })
        ),
      ]),
    ]),
  ],
})
export class AdvancedInvoiceComponent implements OnInit {
  @ViewChild('itemsTable')
  itemsTable;

  public currency = new FormControl('');
  public deliveryDate = new FormControl('');
  public payeeETHAddress = new FormControl('');
  public payerETHAddress = new FormControl('');

  private form: FormGroup;
  public invoiceData: FormGroup;

  public creationDate = new FormControl('', Validators.required);
  public invoiceNumber = new FormControl('', Validators.required);
  public note = new FormControl('');
  public purchaseOrderId = new FormControl('');
  public terms = new FormControl('');

  public sellerInfo = this.formBuilder.group({
    businessName: [null],
    address: this.formBuilder.group({
      streetAddress: [null],
      extendedAddress: [null],
      locality: [null],
      postalCode: [null],
      region: [null],
      country: [null],
    }),
    companyRegistration: [null],
    taxRegistration: [null],
  });

  public buyerInfo = this.formBuilder.group({
    firstName: [null],
    lastName: [null],
    businessName: [null],
    address: this.formBuilder.group({
      streetAddress: [null],
      extendedAddress: [null],
      locality: [null],
      postalCode: [null],
      region: [null],
      country: [null],
    }),
  });

  public paymentTerms = this.formBuilder.group({
    dueDate: [null],
    lateFeesFix: [
      null,
      [Validators.min(0), this.web3Service.decimalValidator(this.currency)],
    ],
    lateFeesPercent: [null, Validators.min(0)],
  });

  constructor(
    private formBuilder: FormBuilder,
    public web3Service: Web3Service,
    private utilService: UtilService,
    private router: Router
  ) {
    this.payeeETHAddress.setValidators(
      Validators.compose([
        this.web3Service.isAddressValidator(this.currency),
        this.web3Service.isSameAddressValidator(this.payerETHAddress),
        Validators.required,
      ])
    );

    this.payerETHAddress.setValidators(
      Validators.compose([
        this.web3Service.isAddressValidator(this.currency),
        this.web3Service.isSameAddressValidator(this.payeeETHAddress),
        Validators.required,
      ])
    );

    this.addInvoiceItem(false);

    this.invoiceData = this.formBuilder.group({
      meta: {
        format: 'rnf_invoice',
        version: '0.0.2',
      },
      creationDate: this.creationDate,
      invoiceNumber: this.invoiceNumber,
      purchaseOrderId: this.purchaseOrderId,
      note: this.note,
      terms: this.terms,
      sellerInfo: this.sellerInfo,
      buyerInfo: this.buyerInfo,
      invoiceItems: this.invoiceItems,
      paymentTerms: this.paymentTerms,
      miscellaneous: {
        builderId: 'app.request.network',
      },
    });

    this.form = this.formBuilder.group({
      payee: this.payeeETHAddress,
      payer: this.payerETHAddress,
      currency: this.currency,
      deliveryDate: this.deliveryDate,
      data: this.invoiceData,
    });
  }

  public invoiceItems = new FormArray([], Validators.required);
  public invoiceItemsColumns = [
    'name',
    'quantity',
    'unitPrice',
    'discount',
    'taxPercent',
    'amount',
  ];

  private account;

  public shouldShowSellerDetails = false;
  public shouldShowBuyerDetails = false;
  private sendingInvoice = false;

  public taxFreeTotal;
  public vatTotal;
  public totalWithTax;

  public addInvoiceItem(rerender = true) {
    this.invoiceItems.push(
      this.formBuilder.group({
        name: [null, Validators.required],
        quantity: [
          null,
          Validators.compose([Validators.required, Validators.min(0)]),
        ],
        unitPrice: [
          null,
          Validators.compose([
            Validators.required,
            this.web3Service.decimalValidator(this.currency),
          ]),
        ],
        discount: [null, this.web3Service.decimalValidator(this.currency)],
        taxPercent: [
          null,
          Validators.compose([
            Validators.required,
            this.web3Service.decimalValidator(this.currency),
          ]),
        ],
      })
    );
    if (rerender) {
      this.itemsTable.renderRows();
    }
  }

  private deleteInvoiceItem(index) {
    this.invoiceItems.removeAt(index);
    this.itemsTable.renderRows();
  }

  getTaxFreeTotal() {
    return this.invoiceItems.value.reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .amountToBN(item.unitPrice, this.currency.value)
            .sub(
              this.web3Service.amountToBN(item.discount, this.currency.value)
            )
            .mul(this.web3Service.BN(item.quantity || 0))
        ),
      this.web3Service.BN()
    );
  }

  getVatTotal() {
    return this.invoiceItems.value.reduce(
      (acc, item) =>
        acc.add(
          this.web3Service
            .amountToBN(item.unitPrice, this.currency.value)
            .sub(
              this.web3Service.amountToBN(item.discount, this.currency.value)
            )
            .mul(this.web3Service.BN(item.quantity || 0))
            .mul(this.web3Service.BN(Math.round(item.taxPercent * 100)))
            .div(this.web3Service.BN(10000))
        ),
      this.web3Service.BN()
    );
  }

  updateTotals() {
    this.taxFreeTotal = this.getTaxFreeTotal();
    this.vatTotal = this.getVatTotal();
    this.totalWithTax = this.taxFreeTotal.add(this.vatTotal);
  }

  itemAmount(unitPrice, discount, quantity) {
    if (!this.web3Service.web3Ready) {
      return '0';
    }
    return this.web3Service.BNToAmount(
      this.web3Service
        .amountToBN(unitPrice, this.currency.value)
        .sub(this.web3Service.amountToBN(discount, this.currency.value))
        .mul(this.web3Service.BN(quantity || 0)),
      this.currency.value
    );
  }

  sendInvoice() {
    this.sendingInvoice = true;

    if (this.web3Service.watchDog()) {
      this.sendingInvoice = false;
      return;
    }

    if (this.form.invalid) {
      this.sendingInvoice = false;
      this.validateAllFormFields(this.form);
      this.utilService.openSnackBar('Some form fields are invalid.');
      return;
    }

    // Deep clone and remove empty values
    const cleanDeepClone = (obj, target = {}) =>
      Object.entries(obj).reduce((acc, [key, val]) => {
        if (val) {
          if (Array.isArray(val)) {
            acc[key] = cleanDeepClone(val, []);
          } else if (moment.isMoment(val)) {
            acc[key] = moment(val);
          } else if (typeof val === 'object') {
            acc[key] = cleanDeepClone(val);
          } else {
            acc[key] = val;
          }
        }
        return acc;
      }, target);

    const data = cleanDeepClone(this.invoiceData.value);

    if (!data['invoiceItems'].length) {
      this.sendingInvoice = false;
      this.utilService.openSnackBar('Invoice must contain at least one item');
      return;
    }

    const deliveryDate =
      this.deliveryDate.value && moment.isMoment(this.deliveryDate.value)
        ? this.deliveryDate.value.toISOString()
        : null;

    this.updateTotals();

    data['invoiceItems'].forEach(item => {
      item['currency'] = this.currency.value;
      item['unitPrice'] = this.web3Service
        .amountToBN(item['unitPrice'], this.currency.value)
        .toString();
      if (item['discount']) {
        item['discount'] = this.web3Service
          .amountToBN(item['discount'], this.currency.value)
          .toString();
      }
      if (deliveryDate) {
        item['deliveryDate'] = deliveryDate;
      }
    });

    if (data['paymentTerms']['lateFeesFix']) {
      data['paymentTerms']['lateFeesFix'] = this.web3Service
        .amountToBN(data['paymentTerms']['lateFeesFix'], this.currency.value)
        .toString();
    }

    if (data['creationDate'] && moment.isMoment(data['creationDate'])) {
      data['creationDate'] = data['creationDate'].toISOString();
    }
    if (
      data['paymentTerms'] &&
      data['paymentTerms']['dueDate'] &&
      moment.isMoment(data['creationDate']['dueDate'])
    ) {
      data['paymentTerms']['dueDate'] = data['paymentTerms'][
        'dueDate'
      ].toISOString();
    }

    /* TODO: uncomment when requestnetwork-data-format is working with webpack.
    const result = RequestNetworkDataFormat.validate(data);
    if (!result.valid) {
      this.sendingInvoice = false;
      this.utilService.openSnackBar(result.errors);
      return;
    }
    */

    const callback = response => {
      this.sendingInvoice = false;

      if (response.transaction) {
        this.utilService.openSnackBar(
          'The request is being created. Please wait a few moments for it to appear on the Blockchain.',
          'Ok',
          'info-snackbar'
        );
        const request = {
          payee: {
            address: this.payeeETHAddress.value,
            balance: this.totalWithTax.toString(),
            expectedAmount: this.totalWithTax.toString(),
          },
          currencyContract: {
            payeePaymentAddress:
              this.payeeETHAddress.value &&
              this.payeeETHAddress.value !== this.account
                ? this.payeeETHAddress.value
                : null,
          },
          currency: this.currency.value,
          payer: this.payerETHAddress.value,
          data: { data: Object.assign({}, data) },
        };

        return this.router.navigate(
          ['/request/txHash', response.transaction.hash],
          {
            queryParams: { request: btoa(JSON.stringify(request)) },
          }
        );
      } else if (response.message) {
        if (response.message.includes('6985')) {
          return this.utilService.openSnackBar(
            'Invalid status 6985. User denied transaction.'
          );
        } else if (response.message.includes('newBlockHeaders')) {
          return;
        } else if (
          response.message.startsWith(
            'Returned error: Error: MetaMask Tx Signature'
          )
        ) {
          return this.utilService.openSnackBar(
            'MetaMask Tx Signature: User denied transaction signature.'
          );
        } else {
          console.error(response);
          return this.utilService.openSnackBar(response.message);
        }
      }
    };

    this.web3Service
      .createRequest(
        'Payee',
        this.payerETHAddress.value,
        this.web3Service.BNToAmount(this.totalWithTax, this.currency.value),
        this.currency.value,
        this.payeeETHAddress.value,
        { data },
        this.payerETHAddress.value
      )
      .on('broadcasted', response => {
        callback(response);
      })
      .catch(err => {
        callback(err);
      });
  }

  validateAllFormFields(formControl) {
    let controls;
    if (formControl instanceof FormGroup) {
      controls = Object.values(formControl.controls);
    } else if (formControl instanceof FormArray) {
      controls = formControl.controls;
    }

    controls.forEach(control => {
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.validateAllFormFields(control);
      }
    });
  }

  async ngOnInit() {
    if (!this.web3Service || !this.web3Service.web3Ready) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.ngOnInit();
    }
    this.watchAccount();

    this.invoiceItems.valueChanges.subscribe(_ => {
      this.updateTotals();
    });
    this.updateTotals();
  }

  watchAccount() {
    this.web3Service.accountObservable.subscribe(account => {
      this.payeeETHAddress.setValue(account);
      this.account = account;
      this.payerETHAddress.updateValueAndValidity();
    });
  }
}
