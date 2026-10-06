import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div style="padding: 32px 24px; font-family: 'Inter', sans-serif;">
      
      <h2 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; letter-spacing: -0.025em; text-align: center;">
        {{ data.title }}
      </h2>
      
      <p style="margin: 0 0 20px; color: #475569; font-size: 0.95rem; line-height: 1.6; text-align: center;">
        {{ data.message }}
      </p>

      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>{{ data.inputLabel || 'Keterangan' }}</mat-label>
        <textarea matInput [(ngModel)]="inputValue" rows="3" [placeholder]="data.inputPlaceholder || ''"></textarea>
      </mat-form-field>
      
      <div style="display: flex; gap: 16px; justify-content: flex-end; margin-top: 12px;">
        <button mat-flat-button (click)="dialogRef.close(null)" style="background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 6px 16px; border-radius: 8px;">
          Batal
        </button>
        <button mat-flat-button color="primary" (click)="submit()" [disabled]="data.required && !inputValue.trim()" style="font-weight: 600; padding: 6px 16px; border-radius: 8px;">
          {{ data.confirmText || 'Simpan' }}
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
export class PromptDialogComponent {
  inputValue: string = '';

  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, inputLabel?: string, inputPlaceholder?: string, confirmText?: string, required?: boolean }
  ) {}

  submit() {
    if (this.data.required && !this.inputValue.trim()) return;
    this.dialogRef.close(this.inputValue);
  }
}
