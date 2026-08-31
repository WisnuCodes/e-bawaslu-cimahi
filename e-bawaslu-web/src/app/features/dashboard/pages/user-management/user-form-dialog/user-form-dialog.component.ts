import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../../../../core/services/user/user.service';
import { MasterDataService, Divisi, WilayahTps } from '../../../../../core/services/master-data.service';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.css'
})
export class UserFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private masterDataService = inject(MasterDataService);

  userForm: FormGroup;
  isEditMode = false;
  
  divisiList: Divisi[] = [];
  tpsList: WilayahTps[] = [];

  roles = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Superadmin', label: 'Superadmin' },
    { value: 'Pimpinan', label: 'Pimpinan (Ketua/Anggota)' },
    { value: 'Pegawai', label: 'Pegawai Bawaslu' },
    { value: 'Saksi TPS', label: 'Saksi / Pengawas TPS' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    this.isEditMode = !!data;
    
    this.userForm = this.fb.group({
      username: [data?.username || '', [Validators.required]],
      email: [data?.email || '', [Validators.required, Validators.email]],
      whatsapp_number: [data?.whatsapp_number || ''],
      role: [data?.role || '', [Validators.required]],
      password: [''],
      divisi_id: [data?.divisi_id || ''],
      tps_id: [data?.tps_id || ''],
      status_aktif: [data ? data.status_aktif : true]
    });
  }

  ngOnInit(): void {
    this.masterDataService.getDivisi().subscribe(res => {
      if (res.success) this.divisiList = res.data;
    });
    
    this.masterDataService.getTps().subscribe(res => {
      if (res.success) this.tpsList = res.data;
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      if (this.isEditMode && !formValue.password) {
        delete formValue.password;
      }
      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
