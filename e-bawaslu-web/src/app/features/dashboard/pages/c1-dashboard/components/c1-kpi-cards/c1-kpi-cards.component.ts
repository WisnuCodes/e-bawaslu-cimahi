import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-c1-kpi-cards',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule, DecimalPipe],
  templateUrl: './c1-kpi-cards.component.html',
  styleUrls: ['./c1-kpi-cards.component.css']
})
export class C1KpiCardsComponent {
  @Input() totalTpsPilot: number = 0;
  @Input() c1ListLength: number = 0;
  @Input() progressPercentage: number = 0;
  @Input() verifiedProgressPercentage: number = 0;
  
  @Input() totalSuaraSahKota: number = 0;
  @Input() totalSuaraTidakSahKota: number = 0;
  @Input() totalPemilihKota: number = 0;
  @Input() totalMismatchCount: number = 0;
  @Input() totalSuaraPaslonKota: { key: string, val: number }[] = [];
}
