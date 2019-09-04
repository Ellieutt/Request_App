import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoices-root',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {

  public baseUrl = '';

  constructor(public router: Router) {}

  ngOnInit() {
      const urlFull = window.location.href;
      const url = urlFull.substr(0, urlFull.length - 2); // remove trailing #/
      // Remove protocol as it's not supported on Metamask Mobile
      this.baseUrl = url.replace(/https?:\/\//i, '');
  }
}
