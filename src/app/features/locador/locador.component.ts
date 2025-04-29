import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ContratoAluguel } from '../../core/models/ContratoAluguel';
import { FullContractDetail } from '../../core/models/Response/FullContractDetail';
import { InfoContratoSimples } from '../../core/models/Response/InfoContratoSimples';
import { ImportsModule } from '../../imports';
import { CardDetailsContratoComponent } from '../../shared/components/card-details-contrato/card-details-contrato.component';
import { CardInfoContratoComponent } from '../../shared/components/card-info-contrato/card-info-contrato.component';
import { ContractService } from '../../shared/services/contract.service';
import { EthereumService } from '../../shared/services/ethereum.service';
import { addressEqualLocator } from '../../shared/validators/address-equal-locator.validator';
import { addressRenterValidValidator } from '../../shared/validators/address-renter-valid.validator';

@Component({
  selector: 'app-locador',
  imports: [
    ImportsModule,
    CardInfoContratoComponent,
    CardDetailsContratoComponent,
  ],
  templateUrl: './locador.component.html',
  styleUrl: './locador.component.css',
})
export class LocadorComponent implements OnInit, OnDestroy {
  visible: boolean = false;
  registerForm: FormGroup | null = null;
  contracts: InfoContratoSimples[] = [];
  fullContract!: FullContractDetail;
  loading: boolean = true;
  isLocador: boolean = true;
  currentAccount!: string | null;
  registering: boolean = false;

  private accountSub?: Subscription;

  @ViewChild(CardDetailsContratoComponent)
  cardDetailsContratoComponent!: CardDetailsContratoComponent;

  constructor(
    private _formBuilder: FormBuilder,
    private _contractService: ContractService,
    private _ethereumService: EthereumService,
    private _toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.accountSub = this._ethereumService.accountChanged$.subscribe(
      (account: string | null) => {
        this.currentAccount = account;
        this.getContratosLocador();
      }
    );
  }

  private getContratosLocador() {
    if (this.currentAccount) {
      this._contractService
        .getContratosLocador(this.currentAccount)
        .then((contratos) => {
          this.contracts = contratos;
          this.loading = false;
        })
        .catch((error) => {
          this._toastrService.error('Erro ao obter contratos do locador');
          this.loading = false;
        });
    } else {
      this._toastrService.error(
        'Por favor conecte a Wallet',
        'Nenhuma Wellet Conectada'
      );
    }
  }

  public onClickCreateContract() {
    this.visible = true;
    this.initForm();
  }

  public closeModal() {
    this.visible = false;
    if (this.registerForm) {
      this.registerForm.reset({
        valorMensal: 0,
        duracaoMeses: 1,
      });
    }
  }

  private initForm() {
    if (!this.registerForm) {
      try {
        this.registerForm = this._formBuilder.group({
          nomeLocador: ['', Validators.required],
          nomeLocatario: ['', Validators.required],
          address: ['', {
            validators: Validators.required,
            asyncValidators: [addressRenterValidValidator(), addressEqualLocator(this.currentAccount)],
          }],
          valorMensal: [0, Validators.required],
          duracaoMeses: [1, [Validators.required, Validators.min(1)]],
        });
      } catch (error) {
        this._toastrService.error(
          'Tente novamente',
          'Erro ao criar novo contrato'
        );
      }
    }
  }

  public openModalDetailsContrato(contractId: number) {
    this._contractService
      .getFullContractDetails(contractId)
      .then((contract: FullContractDetail) => {
        this.fullContract = contract;
        this.cardDetailsContratoComponent.showModal();
      })
      .catch((error) => {
        this._toastrService.error(
          error.message,
          'Erro ao buscar informações do contrato'
        );
      });
  }

  public onSubmit() {
    if (this.registerForm && this.registerForm.valid) {
      this.registering = true;

      const dadosNovoContrato: ContratoAluguel = {
        nomeLocador: this.registerForm.get('nomeLocador')?.value,
        nomeLocatario: this.registerForm.get('nomeLocatario')?.value,
        locatario: this.registerForm.get('address')?.value,
        valorMensal: this.registerForm.get('valorMensal')?.value.toFixed(3),
        duracaoMeses: this.registerForm.get('duracaoMeses')?.value,
      };

      if(this.currentAccount === dadosNovoContrato.locatario){
        this._toastrService.error(
          'O locatário não pode ser o mesmo que o locador',
          'Erro ao criar contrato'
        );
        this.registering = false;
        return;
      }

      this._contractService
        .createContratoAluguel(dadosNovoContrato)
        .then((receipt) => {
          this.registering = false;
          this._toastrService.success(
            'Contrato criado com sucesso!',
            'Sucesso'
          );
          this.getContratosLocador();
          this.closeModal();
        })
        .catch((error) => {
          this._toastrService.error(error.message, 'Erro ao criar contrato');
          this.registering = false;
        });
    }
  }

  get address(){
    return this.registerForm?.get('address');
  }

  ngOnDestroy(): void {
    this.accountSub?.unsubscribe();
  }
}
