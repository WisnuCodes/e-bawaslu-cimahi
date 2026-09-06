import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  show(message: string, type: NotificationType = 'info', duration: number = 5000) {
    const panelClass = this.getPanelClass(type);
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass
    };

    this.snackBar.open(message, 'Tutup', config);
  }

  success(message: string, duration: number = 5000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 5000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 5000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 5000) {
    this.show(message, 'info', duration);
  }

  private getPanelClass(type: NotificationType): string[] {
    const classes = ['notification-base'];
    
    switch (type) {
      case 'success':
        return [...classes, 'bg-green-600', 'text-white'];
      case 'error':
        return [...classes, 'bg-red-600', 'text-white'];
      case 'warning':
        return [...classes, 'bg-amber-600', 'text-white'];
      case 'info':
        return [...classes, 'bg-blue-600', 'text-white'];
      default:
        return classes;
    }
  }
}
