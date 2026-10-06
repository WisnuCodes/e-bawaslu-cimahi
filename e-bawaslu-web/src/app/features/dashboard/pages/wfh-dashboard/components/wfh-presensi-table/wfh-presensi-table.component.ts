import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { environment } from '../../../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-wfh-presensi-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './wfh-presensi-table.component.html',
  styleUrls: ['../../wfh-table.shared.css', './wfh-presensi-table.component.css']
})
export class WfhPresensiTableComponent implements AfterViewInit {
  @Input() set data(value: any[]) {
    this.dataSource.data = value;
  }
  @Input() displayedColumns: string[] = [];
  @Input() isAdmin = false;
  @Input() canViewOthers = false;
  
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  
  @Input() editingPresensiId: string | null = null;
  @Input() editPresensiStatusCI = '';
  @Input() editPresensiStatusCO = '';

  @Output() filterDate = new EventEmitter<{startDate: Date | null, endDate: Date | null}>();
  @Output() exportToCSV = new EventEmitter<void>();
  @Output() editPresensi = new EventEmitter<any>();
  @Output() deletePresensi = new EventEmitter<string>();
  @Output() savePresensiEvent = new EventEmitter<{id: string, statusCI: string, statusCO: string}>();
  @Output() cancelEditEvent = new EventEmitter<void>();

  @ViewChild('presensiPaginator') paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onFilterDate() {
    this.filterDate.emit({ startDate: this.startDate, endDate: this.endDate });
  }

  onExport() {
    this.exportToCSV.emit();
  }

  onEdit(row: any) {
    this.editPresensi.emit(row);
  }

  onDelete(id: string) {
    this.deletePresensi.emit(id);
  }

  onSave(id: string) {
    this.savePresensiEvent.emit({
      id,
      statusCI: this.editPresensiStatusCI,
      statusCO: this.editPresensiStatusCO
    });
  }

  onCancel() {
    this.cancelEditEvent.emit();
  }

  isAbsence(row: any): boolean {
    return ['Sakit', 'Izin', 'Cuti'].includes(row.status_ci);
  }

  getAttachmentUrl(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const relativePath = path.replace(/^\/+/, '').replace(/^storage\//, '');
    return `${baseUrl}/storage/${relativePath}`;
  }

  safeDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    // Replace space with T for Safari/iOS compatibility
    const safeStr = dateStr.replace(' ', 'T');
    return new Date(safeStr);
  }
}
