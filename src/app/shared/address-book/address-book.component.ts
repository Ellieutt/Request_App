import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'address-book',
  templateUrl: './address-book.component.html',
  styleUrls: ['./address-book.component.scss'],
})

export class AddressBookComponent implements OnInit {
    showAddressBook = true;
    editLabel = false;
    @Input()
    addressToAdd: string;
    @Input()
    displayName: string;
    
    ngOnInit() {
      if (!this.displayName) {
        this.displayName = "Address";
      }
    }

    toggleEdition() {
      this.editLabel = !this.editLabel;
    }
}