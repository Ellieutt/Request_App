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
      this.baseUrl = window.location.href;
  }
}
