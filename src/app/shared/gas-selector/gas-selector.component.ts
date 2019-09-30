import { Component, OnInit } from '@angular/core';
import { GasService } from '../../util/gas.service';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-gas-selector',
  templateUrl: './gas-selector.component.html',
  styleUrls: ['./gas-selector.component.scss'],
})
export class GasSelectorComponent implements OnInit {
  public noGasPrices = false;
  public currentGasCategory = 'fast';

  public gasCategoryLabels = {
    safeLow: 'Low',
    average: 'Standard',
    fast: 'Fast',
    fastest: 'Fastest',
    custom: 'Custom',
  };

  constructor(private gasService: GasService) {}

  ngOnInit() {
    this.gasService.gasPricesObservable.subscribe({
      next: prices => {
        this.gasService.gasPrice = prices[this.currentGasCategory];
      },
      error: _ => {
        this.noGasPrices = true;
      },
    });
  }

  public customClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  public selectGasCategory(gasPriceCategory: string, gasPrice: number) {
    this.currentGasCategory = gasPriceCategory;
    if (gasPrice) {
      this.gasService.gasPrice = gasPrice;
    }
  }

  sliderInput(event: MatSliderChange) {
    this.selectGasCategory('custom', event.value);
  }
}
