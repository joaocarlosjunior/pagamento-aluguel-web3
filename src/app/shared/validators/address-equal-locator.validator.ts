import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Observable, of } from "rxjs";

export function addressEqualLocator(addressLocator: string | null): ValidatorFn{
  return (control: AbstractControl): Observable<ValidationErrors | null>  => {
    const address = control.value;
    if(addressLocator === undefined || addressLocator === null){
      return of(null);
    }

    const isValid = address === addressLocator;

    return isValid ?  of({ addressEqual: true }): of(null);
  };
}
