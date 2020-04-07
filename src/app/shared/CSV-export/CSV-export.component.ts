import { Component, Input } from '@angular/core';
import { Web3Service } from 'src/app/util/web3.service';

@Component({
  selector: 'CSV-export',
  templateUrl: './CSV-export.component.html',
  styleUrls: ['./CSV-export.component.scss'],
})
export class CSVExportComponent {
  @Input()
  requests: Array<any>;

  popupVisible: boolean;

  constructor(private web3Service: Web3Service) {
    this.popupVisible = false;
  }

  exportOrWarn() {
    if (this.nbValid() == this.requests.length) {
      this.exportToCsv();
    } else {
      this.togglePopup();
    }
  }

  togglePopup() {
    this.popupVisible = !this.popupVisible;
  }

  isValid(request: any) {
    return request.request && request._meta && request._meta.timestamp;
  }

  nbValid() {
    return this.requests.filter(r => {
      return this.isValid(r);
    }).length;
  }

  exportToCsv() {
    const today = new Date();
    const filename =
      '' +
      today.getFullYear() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today
        .getDate()
        .toString()
        .padStart(2, '0') +
      '_' +
      today
        .getHours()
        .toString()
        .padStart(2, '0') +
      today
        .getMinutes()
        .toString()
        .padStart(2, '0') +
      today
        .getSeconds()
        .toString()
        .padStart(2, '0') +
      '_requests.csv';
    const processRow = function(row) {
      let finalVal = '';
      for (let j = 0; j < row.length; j++) {
        let innerValue = row[j] === undefined ? '' : row[j].toString();
        if (row[j] instanceof Date) {
          innerValue = row[j].toLocaleString();
        }
        let result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0) {
          result = '"' + result + '"';
        }
        if (j > 0) {
          finalVal += ',';
        }
        finalVal += result;
      }
      return finalVal + '\n';
    };

    let csvFile = '';
    const rows = [];
    rows.push([
      'Request Date',
      'Request ID',
      'Requester',
      'Requester Label',
      'Payer',
      'Payer Label',
      'Payment Address',
      'Amount',
      'Currency',
      'Status',
      'Reason',
      'BuilderID',
      'Block Number',
    ]);
    this.requests.filter(r => this.isValid(r)).forEach(req => {
      rows.push([
        new Date(req._meta.timestamp * 1000),
        req.requestId,
        req.request.creator,
        req.request.payee.label ? req.request.payee.label : '',
        req.request.payer,
        req.request.payerLabel ? req.request.payerLabel : '',
        req.request.currencyContract.payeePaymentAddress,
        this.web3Service.BNToAmount(
          req.request.payee.expectedAmount,
          req.request.currency
        ),
        req.request.currency,
        req.request.status,
        req.request.data && req.request.data.data
          ? req.request.data.data.reason
          : '',
        req.request.data &&
        req.request.data.data &&
        req.request.data.data.miscellaneous
          ? req.request.data.data.miscellaneous.builderId
          : '',
        req._meta.blockNumber,
      ]);
    });
    for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        // feature detection
        // Browsers that support HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
}
