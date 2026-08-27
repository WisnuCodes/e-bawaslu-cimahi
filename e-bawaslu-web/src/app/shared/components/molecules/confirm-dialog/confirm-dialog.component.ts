import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div style="padding: 32px 24px; text-align: center; font-family: 'Inter', sans-serif;">
      <div style="
        width: 64px; 
        height: 64px; 
        border-radius: 50%; 
        background-color: #fee2e2; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        margin: 0 auto 20px;
        box-shadow: 0 0 0 8px #fef2f2;
      ">
        <mat-icon style="color: #ef4444; font-size: 32px; width: 32px; height: 32px;">warning_amber</mat-icon>
      </div>
      
      <h2 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; letter-spacing: -0.025em;">
        {{ data.title }}
      </h2>
      
      <p style="margin: 0 0 32px; color: #475569; font-size: 0.95rem; line-height: 1.6; padding: 0 16px;">
        {{ data.message }}
      </p>
      
      <div style="display: flex; gap: 16px; justify-content: center; padding: 0 16px;">
        <button mat-flat-button (click)="dialogRef.close(false)" style="flex: 1; background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 6px 0; border-radius: 8px;">
          Batal
        </button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)" style="flex: 1; font-weight: 600; padding: 6px 0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">
          {{ data.confirmText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      border-radius: 16px;
      overflow: hidden;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, confirmText: string }
  ) {}
}
