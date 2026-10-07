import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FilePreviewComponent } from '../../../../../../shared/components/molecules/file-preview/file-preview.component';
import { WilayahTps } from '../../../../../../core/services/master-data.service';

@Component({
  selector: 'app-c1-upload-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    FilePreviewComponent
  ],
  templateUrl: './c1-upload-form.component.html',
  styleUrls: ['./c1-upload-form.component.css']
})
export class C1UploadFormComponent {
  @Input() canWriteDocuments: boolean = false;
  @Input() c1Form!: FormGroup;
  @Input() tpsList: WilayahTps[] = [];
  @Input() sumSuaraPaslon: number = 0;
  @Input() isMismatch: boolean = false;
  @Input() totalSuaraMasukForm: number = 0;
  @Input() selectedFile: File | null = null;
  @Input() isOcrScanning: boolean = false;
  @Input() ocrStatusText: string = '';
  @Input() editingC1Id: string | null = null;
  @Input() isAdmin: boolean = false;
  @Input() isUploading: boolean = false;

  @Output() fileSelected = new EventEmitter<Event>();
  @Output() jumlahPaslonChange = new EventEmitter<number>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  get suaraPaslonControls() {
    return (this.c1Form.get('suara_paslon') as FormArray).controls;
  }
}
