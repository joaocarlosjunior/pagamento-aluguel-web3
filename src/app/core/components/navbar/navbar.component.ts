import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { EthereumService } from '../../../shared/services/ethereum.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  showNav: boolean = false;
  walletConnected: boolean = false;
  accountCurrent: string  | null= '';

  private activeRoutes: string[] = ['/main', '/locador', '/locatario'];

  constructor(
    private ethereumService: EthereumService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    // Verifica se a carteira está conectada
    this.ethereumService.accountChanged$.subscribe((account) => {
      this.accountCurrent = account;
      this.walletConnected = !!account; // Define como true se houver uma conta conectada
    });

    this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Verifica se a rota atual está na lista de rotas permitidas
        this.showNav = this.activeRoutes.some((route) =>
          this._router.url.startsWith(route)
        );
      }
    });
  }
}
