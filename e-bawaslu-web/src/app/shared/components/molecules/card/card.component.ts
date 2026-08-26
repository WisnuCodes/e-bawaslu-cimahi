import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="app-card">
      <mat-card-header *ngIf="title">
        <mat-card-title>{{ title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ng-content></ng-content>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .app-card {
      margin-bottom: 1rem;
    }
    mat-card-header {
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 0.5rem;
    }
  `]
})
export class CardComponent {
  @Input() title?: string;
}
