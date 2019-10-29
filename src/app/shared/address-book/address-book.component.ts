import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.scss'],
})

export class AddressBookComponent implements OnInit {
    showAddressBook = true;
    addressToAdd = "0xc257274276a4e539741ca11b590b9447b26a8051";
    blockchainName = "Eth";
    ngOnInit() {
    }
}