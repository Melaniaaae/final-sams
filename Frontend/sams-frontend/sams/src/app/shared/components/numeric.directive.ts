import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNumeric]',
  standalone: true
})
export class NumericDirective {

  @HostListener('input', ['$event']) onInputChange(event: any) {
    const initialValue = event.target.value;
    // Replace anything that is NOT 0-9 with an empty string
    event.target.value = initialValue.replace(/[^0-9+]*/g, '');

    // If the value changed, trigger a manual input event to ensure 
    // compatibility with Reactive Forms and ngModel.
    if (initialValue !== event.target.value) {
      event.stopPropagation();
    }
  }
}