import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';

  // Quick Demo Accounts based on Bagan Struktur Organisasi Bawaslu Kota Cimahi
  demoAccounts = [
    { title: '🌟 Ketua Bawaslu', name: 'Fathir Rizka Latif, S.H.', email: 'ketua@cimahi.bawaslu.go.id', role: 'Ketua Bawaslu' },
    { title: '🏛️ Kepala Sekretariat', name: 'Sita Dewanur Nugroho, S.STP., M.Si.', email: 'kasek@cimahi.bawaslu.go.id', role: 'Kepala Sekretariat' },
    { title: '👥 Kordiv SDMOD', name: 'Ahmad Hidayat, S.H.I., M.M.', email: 'ahmad.hidayat@cimahi.bawaslu.go.id', role: 'Kordiv SDMOD' },
    { title: '🗳️ Kordiv P2H (Parmas Humas)', name: 'Akhmad Yasin Nugraha, S.H.', email: 'akhmad.yasin@cimahi.bawaslu.go.id', role: 'Kordiv P2H' },
    { title: '⚖️ Kordiv HPS (Hukum Sengketa)', name: 'Jusapuandy, S.I.P.', email: 'jusapuandy@cimahi.bawaslu.go.id', role: 'Kordiv HPS' },
    { title: '📋 Kordiv PP Datin', name: 'Zaenal Ghazali, S.Pd.I., M.I.Pol.', email: 'zaenal.ghazali@cimahi.bawaslu.go.id', role: 'Kordiv PP Datin' },
    { title: '💰 Bendahara Pengeluaran', name: 'Sundari Eka Gayatri, S.P.', email: 'bendahara@cimahi.bawaslu.go.id', role: 'Bendahara' },
    { title: '👩‍💼 Staf SDMOD', name: 'Risa Novitasari, S.AP.', email: 'risa.novitasari@cimahi.bawaslu.go.id', role: 'Staf SDMOD' },
    { title: '👨‍💼 Staf P2H', name: 'Moch. Akbar Pajri, S.H.', email: 'akbar.pajri@cimahi.bawaslu.go.id', role: 'Staf P2H' },
    { title: '🔍 Panwaslu Kecamatan', name: 'Panwascam Cimahi Tengah', email: 'panwascam.tengah@cimahi.bawaslu.go.id', role: 'Panwascam' },
  ];

  selectDemoAccount(email: string) {
    this.loginForm.patchValue({
      email: email,
      password: 'password'
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect to MFA step
        this.router.navigate(['/auth/mfa']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login gagal, periksa kembali kredensial Anda.';
      }
    });
  }
}
