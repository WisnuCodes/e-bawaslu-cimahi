import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button *ngIf="variant === 'primary'"
      mat-flat-button
      color="primary"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
      <ng-content></ng-content>
    </button>
    <button *ngIf="variant === 'outline'"
      mat-stroked-button
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
      <ng-content></ng-content>
    </button>
    <button *ngIf="variant === 'secondary'"
      mat-button
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  
  @Output() onClick = new EventEmitter<Event>();
}
