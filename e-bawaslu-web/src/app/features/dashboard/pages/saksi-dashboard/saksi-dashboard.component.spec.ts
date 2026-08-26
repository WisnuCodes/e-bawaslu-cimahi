import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaksiDashboardComponent } from './saksi-dashboard.component';

describe('SaksiDashboardComponent', () => {
  let component: SaksiDashboardComponent;
  let fixture: ComponentFixture<SaksiDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaksiDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SaksiDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
