import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { EthereumService } from './shared/services/ethereum.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  private accountCurrentSub!: Subscription;

  constructor(
    private _ethereumService: EthereumService,
    private _router: Router
  ) {

    this.accountCurrentSub = this._ethereumService.accountChanged$.subscribe({
      next: (account: string | null) => {
        if (account === null) {
          this._router.navigate(['/home']);
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.accountCurrentSub.unsubscribe();
  }
}
