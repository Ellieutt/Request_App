import { Component, OnInit, Input } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'request-address',
  templateUrl: './request-address.component.html',
  styleUrls: ['./request-address.component.scss'],
})
export class RequestAddressComponent implements OnInit {
  @Input()
  address: string;
  @Input()
  title: string;
  @Input()
  primaryLabel: boolean;
  openAddressBookModal:boolean = false;

  label: string;

  constructor(
    private cookieService: CookieService
  ) {}

  ngOnInit() {
    if (this.cookieService.get('request_label_tags')) {
      const labelList = JSON.parse(
        this.cookieService.get('request_label_tags')
      );
      labelList.forEach(element => {
        if (element.hasOwnProperty(this.address.toLowerCase())) {
          this.label = element[this.address.toLowerCase()];
          return;
        }
      });
    }
  }

  openAddressModal() {
    this.openAddressBookModal = true;
  }

  updateLabel(labelledAddress) {
    this.label = labelledAddress.label;
  }

  closedModal(event) {
    this.openAddressBookModal = event;
  }
}
