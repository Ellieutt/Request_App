import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  ViewChild,
  EventEmitter,
  HostBinding,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import {
  FormControl,
  NgControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatSelect } from '@angular/material';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Web3Service } from '../../util/web3.service';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-currency-selector',
  templateUrl: './currency-selector.component.html',
  styleUrls: ['./currency-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CurrencySelectorComponent,
      multi: true,
    },
    { provide: MatFormFieldControl, useExisting: CurrencySelectorComponent },
  ],
})
export class CurrencySelectorComponent
  implements
    MatFormFieldControl<string>,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ControlValueAccessor {
  static nextId = 0;
  @HostBinding()
  id = `currency-selector-component-${CurrencySelectorComponent.nextId++}`;

  @ViewChild(MatSelect)
  matSelect: MatSelect;

  @Input()
  formControl: FormControl;

  @Input()
  get placeholder() {
    return this.matSelect.placeholder;
  }
  set placeholder(plh) {
    this.matSelect.placeholder = plh;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return this.matSelect.required;
  }
  set required(req) {
    this.matSelect.required = req;
    this.stateChanges.next();
  }

  @Input()
  get disabled() {
    return this.matSelect.disabled;
  }
  set disabled(disable) {
    this.matSelect.disabled = disable;
  }

  @Input()
  get value() {
    return this.matSelect.value;
  }
  set value(value) {
    this.matSelect.value = value;
  }

  @Output()
  selectionChange = new EventEmitter<boolean>();

  get empty() {
    return this.matSelect.empty;
  }

  get shouldLabelFloat() {
    return this.matSelect.shouldLabelFloat;
  }

  get errorState() {
    return this.matSelect.errorState;
  }

  @HostBinding('attr.aria-describedby')
  describedBy = '';

  public currencies: String[];
  public controlType = 'currency-selector';
  public stateChanges = new Subject<void>();
  public focused: boolean;
  public showAllCurrencies = false;
  public ngControl: NgControl;
  public onChange = () => {};
  public onTouched = () => {};

  constructor(
    private web3Service: Web3Service,
    private fm: FocusMonitor,
    private elRef: ElementRef
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    fm.monitor(elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }

  public showAllCurrenciesTrigger() {
    this.showAllCurrencies = true;
  }

  public onCurrencyChange(event) {
    this.selectionChange.emit(event);
  }

  private watchNetworkId() {
    this.web3Service.networkIdObservable.subscribe(networkId => {
      switch (networkId) {
        case 1:
          this.currencies = [
            'ETH',
            'DAI',
            'REQ',
            'RSR',
            'SAI',
            'BAT',
            'DGX',
            'KNC',
            'LINK',
            'OMG',
            'ZRX',
          ];
          break;
        default:
          this.currencies = ['ETH'];
          break;
      }
      if (!this.currencies.includes(this.formControl.value)) {
        this.formControl.setValue('ETH');
      }
    });
  }

  public setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  public writeValue(value) {
    this.value = value;
  }

  public registerOnChange(fn) {
    this.onChange = fn;
  }

  public registerOnTouched(fn) {
    this.onTouched = fn;
  }

  public onContainerClick() {
    this.matSelect.onContainerClick();
  }

  public ngOnInit() {
    this.watchNetworkId();
    if (!this.formControl) {
      this.formControl = new FormControl('');
    }
  }

  public ngAfterViewInit() {
    this.matSelect.stateChanges.subscribe(() => this.stateChanges.next());
  }

  public ngOnDestroy() {
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.elRef.nativeElement);
  }
}
