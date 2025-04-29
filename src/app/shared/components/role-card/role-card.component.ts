import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-role-card',
  imports: [ RouterModule],
  templateUrl: './role-card.component.html',
  styleUrl: './role-card.component.css'
})
export class RoleCardComponent {
  @Input({required: true}) icone!: string;
  @Input({required: true}) titulo!: string;
  @Input({required: true}) descricao!: string;
  @Input({required: true}) role!: string;
}
