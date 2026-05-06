import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphabet]',
  standalone: true
})
export class AlphabetDirective {

  @HostListener('input', ['$event']) onInputChange(event: any) {
    const initialValue = event.target.value;
    // Replace anything that is NOT a-z or A-Z with an empty string
    event.target.value = initialValue.replace(/[^a-zA-Z]*/g, '');
    
    // Ensure the model updates if using ngModel or Reactive Forms
    if (initialValue !== event.target.value) {
      event.stopPropagation();
    }
  }
}