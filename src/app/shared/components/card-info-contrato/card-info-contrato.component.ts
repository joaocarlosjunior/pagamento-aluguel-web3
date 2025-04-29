import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InfoContratoSimples } from '../../../core/models/Response/InfoContratoSimples';

@Component({
  selector: 'app-card-info-contrato',
  imports: [CommonModule],
  templateUrl: './card-info-contrato.component.html',
  styleUrl: './card-info-contrato.component.css'
})
export class CardInfoContratoComponent {
  @Input({required: true}) contrato!: InfoContratoSimples;
  @Input() isLocador: boolean = false;
  @Output() openModalDetails = new EventEmitter<number>();

  public onClickOpenModalDetails(contradoId: number){
    this.openModalDetails.emit(contradoId)
  }

}
