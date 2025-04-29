import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { FullContractDetail } from '../../core/models/Response/FullContractDetail';
import { InfoContratoSimples } from '../../core/models/Response/InfoContratoSimples';
import { CardDetailsContratoComponent } from '../../shared/components/card-details-contrato/card-details-contrato.component';
import { CardInfoContratoComponent } from '../../shared/components/card-info-contrato/card-info-contrato.component';
import { ContractService } from '../../shared/services/contract.service';
import { EthereumService } from '../../shared/services/ethereum.service';

@Component({
  selector: 'app-locatario',
  imports: [CommonModule, CardInfoContratoComponent, CardDetailsContratoComponent],
  templateUrl: './locatario.component.html',
  styleUrl: './locatario.component.css',
})
export class LocatarioComponent implements OnInit, OnDestroy {
  contratos: InfoContratoSimples[] = [];
  currentAccount: string | null = null;
  loading: boolean = true;
  fullContract!: FullContractDetail;
  private accountSub?: Subscription;

   @ViewChild(CardDetailsContratoComponent) cardDetailsContratoComponent!: CardDetailsContratoComponent;

  constructor(
    private _ethereumService: EthereumService,
    private _contractService: ContractService,
    private _toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.accountSub = this._ethereumService.accountChanged$.subscribe(
      (account: string | null) => {
        this.currentAccount = account;
        this.getContratoLocatario();
      }
    )
  }

  ngOnDestroy(): void {
    this.accountSub?.unsubscribe();
  }

  public openModalDetailsContrato(contractId: number){
    this._contractService
    .getFullContractDetails(contractId)
    .then((contract: FullContractDetail) => {
      this.fullContract = contract;
      this.cardDetailsContratoComponent.showModal();
    })
    .catch((error) => {
      this._toastrService.error(error.message, 'Erro ao buscar informações do contrato');
    })
  }

  public getContratoLocatario(){
    if(this.currentAccount){
      this._contractService.getContratosLocatario(this.currentAccount)
      .then((contratos) => {
        this.contratos = contratos;
        this.loading = false;
      })
      .catch((error) => {
        this._toastrService.error('Erro ao obter contratos do locatário');
        this.loading = false;
      });
    }else{
      this._toastrService.error('Por favor conecte a Wallet','Nenhuma Wellet Conectada');
    }
  }
}
