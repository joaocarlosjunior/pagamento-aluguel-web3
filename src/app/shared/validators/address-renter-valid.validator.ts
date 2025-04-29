import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { ethers } from "ethers";
import { Observable, of } from "rxjs";

export function addressRenterValidValidator(): ValidatorFn{
  return (control: AbstractControl): Observable<ValidationErrors | null>  => {
    const address = control.value;

    if(ethers.isAddress(address)){
      return of(null);
    }

    return of({ validator: true });
  };
}
