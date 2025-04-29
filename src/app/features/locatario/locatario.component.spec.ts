import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatarioComponent } from './locatario.component';

describe('LocatarioComponent', () => {
  let component: LocatarioComponent;
  let fixture: ComponentFixture<LocatarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocatarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocatarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
