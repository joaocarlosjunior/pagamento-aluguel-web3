import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserProvider, ethers, Signer } from 'ethers';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EthereumService {
  private provider?: BrowserProvider;
  private signer?: Signer;

  public accountChanged = new BehaviorSubject<string | null>(null);
  accountChanged$ = this.accountChanged.asObservable();

  currentAccount: string | null = null;

  constructor(
    private ngZone: NgZone,
    private _toastrService: ToastrService,
    private _router: Router
  ) {
    this.listenToAccountChanges();
  }

  public async connectWallet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask não instalado');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);

      this.signer = await this.provider.getSigner();
    } catch (error) {
      throw new Error('Erro ao conectar à carteira');
    }

    await this.signer
      .getAddress()
      .then((address: string) => {
        this.currentAccount = address;
        this.accountChanged.next(address);
      })
      .catch(() => {
        throw new Error('Erro ao obter endereço da carteira');
      });
  }

  private listenToAccountChanges() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: unknown) => {
      if(this._router.url !== '/home'){
        window.location.reload();
      }
    });
  }

  async checkWalletConnection(): Promise<void> {
    if (!window.ethereum) {
      return;
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const accounts = await this.provider.listAccounts();
      this.currentAccount = await accounts[0].getAddress();

      if (accounts.length > 0) {
        this.accountChanged.next(this.currentAccount);
      }
    } catch (error) {
      throw new Error('Erro ao conectar carteira');
    }
  }

  private handleAccountChange() {
    if (this.currentAccount) {
      this._toastrService.success(this.currentAccount, 'Nova Conta Conectada:');
    } else {
      this._toastrService.info('Conta desconectada');
    }
  }

  public getSigner() {
    if (!this.signer) {
      throw new Error('Carteira não conectada');
    }
    return this.signer;
  }

  // Remove os listeners quando o serviço é destruído
  ngOnDestroy() {
    window.ethereum?.removeListener(
      'accountsChanged',
      this.handleAccountChange
    );
  }
}
