import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { WilayahTps } from '../../../../../../core/services/master-data.service';

@Component({
  selector: 'app-c1-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './c1-filter.component.html',
  styleUrls: ['./c1-filter.component.css']
})
export class C1FilterComponent {
  @Input() kamar: string = '';
  @Input() kecamatanList: string[] = [];
  @Input() kelurahanList: string[] = [];
  @Input() filteredTps: WilayahTps[] = [];
  @Input() availableYears: string[] = [];
  
  @Input() selectedKecamatan: string = '';
  @Input() selectedKelurahan: string = '';
  @Input() selectedFilterTps: string = '';
  @Input() selectedFilterYear: string = '';

  @Output() selectedKecamatanChange = new EventEmitter<string>();
  @Output() selectedKelurahanChange = new EventEmitter<string>();
  @Output() regionChange = new EventEmitter<boolean>();
  @Output() filterTpsChange = new EventEmitter<string>();
  @Output() filterYearChange = new EventEmitter<string>();

  onKecamatanChange(val: string) {
    this.selectedKecamatanChange.emit(val);
    this.regionChange.emit(true);
  }

  onKelurahanChange(val: string) {
    this.selectedKelurahanChange.emit(val);
    this.regionChange.emit(false);
  }
}
