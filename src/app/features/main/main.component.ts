import { Component, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { RoleCardComponent } from '../../shared/components/role-card/role-card.component';
import { EthereumService } from '../../shared/services/ethereum.service';

@Component({
  selector: 'app-main',
  imports: [RoleCardComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnDestroy{
  currentAccount: string | null = null;
  private accountSub?: Subscription;

  ngOnDestroy(): void {
    this.accountSub?.unsubscribe();
  }
}
