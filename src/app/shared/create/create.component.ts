import { Component } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent {
  constructor(private cookieService: CookieService) {
    if (!this.cookieService.get('deprecated-modal-dismissed')) {
      this.openModal();
    }
  }

  public createModalOpen = false;

  closeModal() {
    this.cookieService.set('deprecated-modal-dismissed', 'true', 1);
    this.createModalOpen = false;
  }
  openModal() {
    this.createModalOpen = true;
  }
}
