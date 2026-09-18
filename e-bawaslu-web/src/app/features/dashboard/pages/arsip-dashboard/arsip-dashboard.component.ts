import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ArsipFacade } from './arsip.facade';
import { ArsipListComponent } from './components/arsip-list/arsip-list.component';
import { ArsipUploadComponent } from './components/arsip-upload/arsip-upload.component';

@Component({
  selector: 'app-arsip-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ArsipListComponent,
    ArsipUploadComponent
  ],
  templateUrl: './arsip-dashboard.component.html',
  styleUrl: './arsip-dashboard.component.css'
})
export class ArsipDashboardComponent implements OnInit {
  public facade = inject(ArsipFacade);

  ngOnInit() {
    this.facade.loadDivisi();
  }
}
