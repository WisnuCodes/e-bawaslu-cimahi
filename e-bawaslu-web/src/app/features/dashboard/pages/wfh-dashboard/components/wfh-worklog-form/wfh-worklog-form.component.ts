import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-wfh-worklog-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './wfh-worklog-form.component.html',
  styleUrl: './wfh-worklog-form.component.css'
})
export class WfhWorklogFormComponent {
  @Input() errorMessage = '';
  fileError = '';
  @Input() isSubmittingLog = false;
  @Input() isEditMode = false;
  
  @Input() set initialActivity(val: string) {
    if (val !== undefined && val !== null) {
      this.worklogForm.patchValue({ activity: val });
    }
  }

  @Output() submitWorklog = new EventEmitter<{activity: string, file: File | null}>();
  @Output() cancelEditEvent = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  worklogForm: FormGroup = this.fb.group({
    activity: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(10000)]]
  });

  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = null;
    this.fileError = '';
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || file.size > 2 * 1024 * 1024) {
      this.fileError = 'Gunakan PDF, JPG, atau PNG dengan ukuran maksimal 2 MB.';
      input.value = '';
      return;
    }
    this.selectedFile = file;
  }

  onSubmit() {
    if (this.worklogForm.invalid || this.isSubmittingLog || this.fileError) return;
    this.submitWorklog.emit({
      activity: this.worklogForm.value.activity.trim(),
      file: this.selectedFile
    });
  }

  onCancelEdit() {
    this.cancelEditEvent.emit();
  }

  resetForm() {
    this.fileError = '';
    this.worklogForm.reset();
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
