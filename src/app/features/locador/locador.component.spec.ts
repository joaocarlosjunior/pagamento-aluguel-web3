import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocadorComponent } from './locador.component';

describe('LocadorComponent', () => {
  let component: LocadorComponent;
  let fixture: ComponentFixture<LocadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
