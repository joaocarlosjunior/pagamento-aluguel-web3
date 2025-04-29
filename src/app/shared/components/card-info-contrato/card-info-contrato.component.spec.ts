import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardInfoContratoComponent } from './card-info-contrato.component';

describe('CardInfoContratoComponent', () => {
  let component: CardInfoContratoComponent;
  let fixture: ComponentFixture<CardInfoContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInfoContratoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardInfoContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
