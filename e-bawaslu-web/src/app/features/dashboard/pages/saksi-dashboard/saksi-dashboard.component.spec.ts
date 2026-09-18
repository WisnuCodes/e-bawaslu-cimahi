import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaksiDashboardComponent } from './saksi-dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SaksiDashboardComponent', () => {
  let component: SaksiDashboardComponent;
  let fixture: ComponentFixture<SaksiDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaksiDashboardComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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
