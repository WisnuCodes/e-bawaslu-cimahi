import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-wfh-worklog-table',
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
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule
  ],
  templateUrl: './wfh-worklog-table.component.html',
  styleUrls: ['../../wfh-table.shared.css', './wfh-worklog-table.component.css']
})
export class WfhWorklogTableComponent implements AfterViewInit {
  @Input() set data(value: any[]) {
    this.dataSource.data = value;
  }
  @Input() displayedColumns: string[] = [];
  @Input() canApprove = false;
  @Input() canViewOthers = false;
  
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;

  @Output() filterDate = new EventEmitter<{startDate: Date | null, endDate: Date | null}>();
  @Output() exportToCSV = new EventEmitter<void>();
  @Output() editWorklog = new EventEmitter<any>();
  @Output() deleteWorklog = new EventEmitter<string>();
  @Output() approveWorklog = new EventEmitter<{id: string, status: 'Approved' | 'Revised'}>();

  @ViewChild('worklogPaginator') paginator!: MatPaginator;

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
    this.editWorklog.emit(row);
  }

  onDelete(id: string) {
    this.deleteWorklog.emit(id);
  }

  onApprove(id: string, status: 'Approved' | 'Revised') {
    this.approveWorklog.emit({ id, status });
  }

  getAttachmentUrl(path: string | null): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const baseUrl = 'http://localhost:8000';
    const relativePath = path.replace(/^\/+/, '').replace(/^storage\//, '');
    return `${baseUrl}/storage/${relativePath}`;
  }
}
