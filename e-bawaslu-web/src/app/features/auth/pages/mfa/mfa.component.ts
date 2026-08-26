import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';
import { InputComponent } from '../../../../shared/components/atoms/input/input.component';
import { useLoading } from '../../../../shared/hooks/use-loading';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mfa.component.html',
  styleUrl: './mfa.component.css'
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
} // trigger rebuild
