import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import {
  IncomingDocService,
} from '../../examples/documents/document-to/incoming-doc.service';

@Directive({
  selector: 'input[numbersTo]'
})
export class NumberDirective {

  constructor(private _el: ElementRef,  private docTo: IncomingDocService,) { }
  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }
  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value;
    this._el.nativeElement.value = initalValue.replace(/[^0-9,]*/g, '');
    if ( initalValue !== this._el.nativeElement.value) {
      event.stopPropagation();
    } else {
      this._el.nativeElement.value = this.docTo.formatNumberTo(initalValue);
    }   
  }

}

@Directive({
  selector: 'input[numbersOnly]'
})
export class FormatMoneyDirective {

  constructor(private _el: ElementRef) { }
  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }
  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value;
    this._el.nativeElement.value = initalValue.replace(/[^0-9,]*/g, '');
    if ( initalValue !== this._el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}