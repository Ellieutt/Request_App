import { Component, OnInit, Input } from '@angular/core';

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
  constructor() {}

  ngOnInit() {}
}
