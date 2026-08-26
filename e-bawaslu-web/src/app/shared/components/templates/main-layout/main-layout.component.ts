import { Component, ViewChild, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { SidebarComponent } from '../../organisms/sidebar/sidebar.component';
import { HeaderComponent } from '../../organisms/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, SidebarComponent, HeaderComponent],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile ? 'over' : 'side'"
        [opened]="!isMobile"
        [fixedInViewport]="isMobile"
        class="sidenav"
        [class.mobile-sidenav]="isMobile">
        <app-sidebar></app-sidebar>
      </mat-sidenav>
      <mat-sidenav-content class="sidenav-content">
        <app-header
          [isMobile]="isMobile"
          (toggleMenu)="sidenav.toggle()">
        </app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 250px;
      border-right: 1px solid var(--color-border);
    }
    .mobile-sidenav {
      width: 280px;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
    }
    .main-content {
      padding: 24px;
      height: calc(100vh - 64px);
      overflow-y: auto;
      box-sizing: border-box;
      background-color: var(--color-background);
    }
    @media (max-width: 768px) {
      .main-content {
        padding: 16px 12px;
        height: calc(100vh - 56px);
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = false;

  private readonly MOBILE_BREAKPOINT = 768;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= this.MOBILE_BREAKPOINT;
  }
}
