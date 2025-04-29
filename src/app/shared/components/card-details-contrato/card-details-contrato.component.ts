import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImportsModule } from '../../../imports';
import { FullContractDetail } from '../../../core/models/Response/FullContractDetail';
import { ContractService } from '../../services/contract.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-card-details-contrato',
  imports: [ImportsModule],
  templateUrl: './card-details-contrato.component.html',
  styleUrl: './card-details-contrato.component.css'
})
export class CardDetailsContratoComponent {
  public visible: boolean = false;
  public visibleConfirmPayment: boolean = false;
  @Input()isLocatario: boolean = false;
  @Input()fullContract!: FullContractDetail;

  @Output() paymentMade = new EventEmitter<boolean>(true);
  public isLoading: boolean = false;

  constructor(
    private _contractService: ContractService,
    private _toastr: ToastrService
  ){}

  public closeModal(){
    this.visible = false;
    this.paymentMade.emit(true);
  }

  public showModal(){
    this.visible = true;
  }

  public closeModalConfirmPayment(){
    this.visibleConfirmPayment = false;
  }

  public showModalConfirmPayment(){
    this.visibleConfirmPayment = true;
  }

  public makePayment(contractId: number,to: string, value: string){
    this.isLoading = true;
    if(to && value){
      this._contractService.makePayment(contractId, to, value)
      .then(() => {
        this.isLoading = false;
        this.fullContract.ativo = false;
        this.closeModalConfirmPayment();
        this._toastr.success('Pagamentro realizado com sucesso');
      })
      .catch((error) => {
        this.isLoading = false;
        this._toastr.error(error.message, 'Erro ao realizar pagamento');
      })
    }
  }

}
