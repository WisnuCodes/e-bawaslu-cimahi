import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { C1Item } from '../../../../../../core/services/c1/c1.service';
import { Divisi, WilayahTps } from '../../../../../../core/services/master-data.service';
import { DateFormatPipe } from '../../../../../../shared/pipes/date-format.pipe';
import * as _ from 'lodash';

@Component({
  selector: 'app-c1-data-table',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule, 
    MatPaginatorModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSelectModule, 
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    DateFormatPipe
  ],
  templateUrl: './c1-data-table.component.html',
  styleUrls: ['./c1-data-table.component.css']
})
export class C1DataTableComponent implements OnChanges {
  @Input() c1List: C1Item[] = [];
  @Input() tpsList: WilayahTps[] = [];
  @Input() divisiList: Divisi[] = [];
  @Input() savingApproval: Record<string, boolean> = {};
  @Input() canDeleteC1: boolean = false;
  @Input() isSuperAdmin: boolean = false;
  @Input() currentUserDivisiId: string | null = null;
  @Input() currentUserRole: string = '';
  @Input() isPimpinan: boolean = false;
  @Input() isKadivP2H: boolean = false;
  @Input() canWriteDocuments: boolean = false;

  @Output() download = new EventEmitter<C1Item>();
  @Output() assignApproval = new EventEmitter<{item: C1Item, division: string}>();
  @Output() approve = new EventEmitter<{item: C1Item, status: 'Approved' | 'Rejected' | 'Revision'}>();
  @Output() edit = new EventEmitter<C1Item>();
  @Output() delete = new EventEmitter<C1Item>();
  @Output() copyHash = new EventEmitter<string>();

  dataSource = new MatTableDataSource<C1Item>([]);
  displayedColumns: string[] = ['tps', 'suara_sah', 'rincian_paslon', 'suara_tidak_sah', 'total_pemilih', 'hash', 'status', 'tanggal', 'aksi'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['c1List']) {
      this.dataSource.data = this.c1List;
      this.dataSource.paginator = this.paginator;
    }
  }

  applyFilterC1 = _.debounce((event: Event) => {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }, 300);

  getTpsInfo(tpsId: string): string {
    const tps = this.tpsList.find(t => t.tps_id === tpsId);
    if (!tps) return tpsId;
    return `TPS ${tps.no_tps} (${tps.kelurahan}, Kec. ${tps.kecamatan})`;
  }

  getPaslonBreakdown(c1: C1Item): { key: string, val: number }[] {
    if (!c1.suara_paslon) return [];
    let paslonData: Record<string, number> | null = null;
    if (typeof c1.suara_paslon === 'string') {
      try { paslonData = JSON.parse(c1.suara_paslon); } catch(e) { paslonData = null; }
    } else {
      paslonData = c1.suara_paslon;
    }

    if (!paslonData) return [];
    
    const result: { key: string, val: number }[] = [];
    Object.keys(paslonData).forEach(key => {
      result.push({ key: key, val: paslonData![key] });
    });
    return result;
  }

  canApproveItem(item: C1Item): boolean {
    if (!this.canWriteDocuments) return false;
    if (this.isPimpinan || this.isKadivP2H) return true;
    return (!!item.approval_divisi_id && item.approval_divisi_id === this.currentUserDivisiId && /kordiv|kadiv|kepala divisi|kasubag|kabag/i.test(this.currentUserRole));
  }
}
