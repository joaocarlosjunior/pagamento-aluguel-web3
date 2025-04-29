import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info-card',
  imports: [],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.css'
})
export class InfoCardComponent {
  @Input({required: true}) icone!: string;
  @Input({required: true}) titulo!: string;
  @Input({required: true}) descricao!: string;
}
