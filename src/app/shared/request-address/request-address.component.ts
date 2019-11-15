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
  showLongAddress: boolean;
  @Input()
  title: string;
  @Input()
  primaryLabel: boolean;
  @Input()
  noAddress: boolean;

  label: string;

  constructor(private cookieService: CookieService) {}

  ngOnInit() {
    if (this.cookieService.get('request_label_tags')) {
      const labelList = JSON.parse(
        this.cookieService.get('request_label_tags')
      );
      labelList.forEach(element => {
        if (element.hasOwnProperty(this.address.toLowerCase())) {
          this.label = element[this.address.toLowerCase()];
          this.showLongAddress = true;
          return;
        }
      });
    }
  }
}
