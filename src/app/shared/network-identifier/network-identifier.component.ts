import { Component, Input } from '@angular/core';

@Component({
  selector: 'network-identifier',
  templateUrl: './network-identifier.component.html',
})
export class NetworkIdentifierComponent {
  @Input()
  isRinkeby: boolean;
}
