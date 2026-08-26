import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  template: `
    <div class="auth-wrapper">
      <main class="auth-container">
        <mat-card class="auth-card">
          <mat-card-header class="auth-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100" class="brand-logo">
              <circle cx="50" cy="50" r="50" fill="var(--color-primary)"/>
              <path d="M 35 25 L 65 25 Q 75 25 75 35 Q 75 45 65 45 L 35 45 Z" fill="white" />
              <path d="M 35 45 L 65 45 Q 80 45 80 60 Q 80 75 65 75 L 35 75 Z" fill="white" />
              <rect x="35" y="25" width="15" height="50" fill="var(--color-primary)" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            </svg>
            <div class="auth-title">
              <h1>Portal Internal</h1>
              <p>Badan Pengawas Pemilu</p>
            </div>
          </mat-card-header>
          <mat-card-content class="auth-body">
            <router-outlet></router-outlet>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-background);
    }
    .auth-container {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    .auth-card {
      padding: 24px;
      border-radius: var(--radius-lg);
    }
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-logo {
      margin-bottom: 16px;
    }
    .auth-title h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 4px;
      color: var(--color-secondary);
    }
    .auth-title p {
      margin: 0;
      color: var(--color-text-muted);
    }
  `]
})
export class AuthLayoutComponent {}
