import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';
import { InputComponent } from '../../../../shared/components/atoms/input/input.component';
import { useLoading } from '../../../../shared/hooks/use-loading';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="mfa-container text-center">
      <h2 class="mb-4">Verifikasi 2 Langkah</h2>
      <p class="mb-4 text-muted">Masukkan kode OTP yang dikirimkan ke perangkat Anda.</p>
      
      <app-input 
        [(ngModel)]="otpCode" 
        placeholder="6 Digit OTP" 
        type="text" 
        [error]="errorMsg">
      </app-input>

      <div class="mt-4">
        <app-button 
          variant="primary" 
          [loading]="isLoading()" 
          [disabled]="otpCode.length < 6"
          (onClick)="verifyOtp()">
          Verifikasi
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    .text-center { text-align: center; }
    .mb-4 { margin-bottom: 1rem; }
    .mt-4 { margin-top: 1rem; }
    .text-muted { color: var(--color-text-muted); }
  `]
})
export class MfaComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  // Menggunakan custom hook yang baru kita buat
  loadingHook = useLoading();
  isLoading = this.loadingHook.isLoading;

  otpCode = '';
  errorMsg = '';

  verifyOtp() {
    this.errorMsg = '';
    this.isLoading.set(true);

    this.authService.verifyMfa(this.otpCode).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg = err.error?.message || 'Kode OTP tidak valid.';
      }
    });
  }
}
