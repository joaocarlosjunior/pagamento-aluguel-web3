import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDetailsContratoComponent } from './card-details-contrato.component';

describe('CardDetailsContratoComponent', () => {
  let component: CardDetailsContratoComponent;
  let fixture: ComponentFixture<CardDetailsContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDetailsContratoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardDetailsContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
