import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { UtilService } from '../../util/util.service';

@Component({
  selector: 'address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.scss'],
})

export class AddressBookComponent implements OnInit {
  @Input()
  addressToAdd: string;
  @Input()
  owner: boolean;
  addressLabel: string;
  @Output()
  emitHideAddressBook = new EventEmitter<boolean>();
  @Output()
  emitNewLabel = new EventEmitter<{ address: string, label: string }>();
  @ViewChild("addressLabelField")
  addressLabelElement: ElementRef;
  editLabel = false;

  constructor(
    private cookieService: CookieService,
    private utilService: UtilService,
  ) { }

  fetchLabelOrEmpty(address: string) {
    if (this.cookieService.get('request_label_tags')) {
      const labelList = JSON.parse(
        this.cookieService.get('request_label_tags')
      ).filter(label => {return label.hasOwnProperty(address.toLowerCase());}
      );
      if (labelList.length == 1) {
        return labelList[0][address.toLowerCase()];
      } else {
        return address;
      }
    } else {
      return address;
    }
  }

  fetchDisplay(address: string) {
    const result = this.fetchLabelOrEmpty(address);
    if (result == '') {
      return address;
    } else {
      return result;
    }
  }

  ngOnInit() {
    this.addressLabel = this.fetchLabelOrEmpty(this.addressToAdd);
  }
  
  toggleEdition() {
    this.editLabel = !this.editLabel;
    if (this.editLabel) {
      setTimeout(() => {this.addressLabelElement.nativeElement.focus()}, 0);
    }
  }

  closeModal() {
    this.emitHideAddressBook.emit(false);
  }

  onSave(address) {
    this.toggleEdition();
    const requestLabelList = [];
    let isNew = true;
    if (this.cookieService.get('request_label_tags')) {
      const labelList = JSON.parse(
        this.cookieService.get('request_label_tags')
      );
      labelList.forEach(element => {
        if (element.hasOwnProperty(address)) {
          isNew = false;
          element[address] = this.addressLabel;
        }
        requestLabelList.push(element);
      });
    }
    if (isNew) {
      requestLabelList.push({
        [address]: this.addressLabel
      });
    }
    this.emitNewLabel.emit({ address, label: this.addressLabel ? this.addressLabel : "" });

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
