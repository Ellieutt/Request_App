import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortAddress',
})
export class ShortAddressPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return `${value.substring(0, 10)}...${value.substring(32, 42)}`;
  }
}
