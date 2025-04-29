import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { InfoCardComponent } from '../../shared/components/info-card/info-card.component';
import { EthereumService } from '../../shared/services/ethereum.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, InfoCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnDestroy {
  public isLoading: boolean = false;
  private accountSub?: Subscription;

  constructor(
    private _ethereumService: EthereumService,
    private _router: Router,
    private _toastr: ToastrService
  ) {}

  public connectWallet() {
    this.isLoading = true;
    this._ethereumService
      .connectWallet()
      .then(() => {
        this._toastr.success('Carteira conectada com sucesso!', 'Sucesso');
        this._router.navigate(['/main']);
      })
      .catch((error: any) => {
        this._toastr.error(error.message, 'Erro de Conexão');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.accountSub?.unsubscribe();
  }
}
