import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService, User } from '../../../../core/services/user/user.service';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import { MatChipsModule } from '@angular/material/chips';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    DateFormatPipe
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users: User[] = [];
  displayedColumns: string[] = ['username', 'email', 'role', 'divisi', 'status_aktif', 'actions'];
  isLoading = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.snackBar.open('Gagal memuat data pengguna', 'Tutup', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: user ? { ...user } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user) {
          // Update
          this.userService.updateUser(user.user_id, result).subscribe({
            next: () => {
              this.snackBar.open('Pengguna berhasil diperbarui', 'Tutup', { duration: 3000 });
              this.loadUsers();
            },
            error: () => this.snackBar.open('Gagal memperbarui pengguna', 'Tutup', { duration: 3000 })
          });
        } else {
          // Create
          this.userService.createUser(result).subscribe({
            next: () => {
              this.snackBar.open('Pengguna berhasil ditambahkan', 'Tutup', { duration: 3000 });
              this.loadUsers();
            },
            error: () => this.snackBar.open('Gagal menambahkan pengguna', 'Tutup', { duration: 3000 })
          });
        }
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.username}?`)) {
      this.userService.deleteUser(user.user_id).subscribe({
        next: () => {
          this.snackBar.open('Pengguna berhasil dihapus', 'Tutup', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          const msg = err.error?.message || 'Gagal menghapus pengguna';
          this.snackBar.open(msg, 'Tutup', { duration: 3000 });
        }
      });
    }
  }
}
