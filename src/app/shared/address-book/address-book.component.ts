import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.scss'],
})

export class AddressBookComponent implements OnInit {
  editLabel = false;
  @Input()
  addressToAdd: string;
  @Input()
  addressLabel: string;
  @Output()
  emitHideAddressBook = new EventEmitter<boolean>();
  @Output()
  emitNewLabel = new EventEmitter<{ address: string, label: string }>();
  newLabelValue: string;

  constructor(
    private cookieService: CookieService,
    private utilService: UtilService,
  ) { }

  ngOnInit() {
    if (!this.addressLabel) {
      this.addressLabel = 'Address';
    }
  }

  toggleEdition() {
    this.editLabel = !this.editLabel;
  }

  onNameChangeInput(label) {
    this.newLabelValue = label;
  }

  closeModal() {
    this.emitHideAddressBook.emit(false);
  }

  onSave(address) {
    this.toggleEdition();
    this.addressLabel = this.newLabelValue;
    const requestLabelList = [];
    let isNew = true;
    if (this.cookieService.get('request_label_tags')) {
      const labelList = JSON.parse(
        this.cookieService.get('request_label_tags')
      );
      labelList.forEach(element => {
        if (element.hasOwnProperty(address)) {
          isNew = false;
          element[address] = this.newLabelValue;
        }
        requestLabelList.push(element);
      });
    }
    if (isNew) {
      requestLabelList.push({
        [address]: this.newLabelValue
      });
    }

    this.emitNewLabel.emit({ address, label: this.newLabelValue });

    this.cookieService.set('request_label_tags', JSON.stringify(requestLabelList), 9999);
  }

  copyToClipboard() {
    this.utilService.openSnackBar(
      'Address copied.',
      null,
      'success-snackbar'
    );
  }
}
