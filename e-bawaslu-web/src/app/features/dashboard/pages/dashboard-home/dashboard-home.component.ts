import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../shared/components/molecules/card/card.component';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, CardComponent, DateFormatPipe, MatIconModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent {
  today = new Date();
}
