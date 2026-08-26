import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 0;">
      <mat-label *ngIf="label">{{ label }}</mat-label>
      <input 
        matInput
        [type]="type" 
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (blur)="onTouched()"
        [disabled]="disabled"
      >
      <mat-error *ngIf="error">{{ error }}</mat-error>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() error: string = '';

  innerValue: any = '';
  disabled: boolean = false;

  get value(): any {
    return this.innerValue;
  }

  set value(v: any) {
    if (v !== this.innerValue) {
      this.innerValue = v;
      this.onChange(v);
    }
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.innerValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
