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
      width: auto !important;
      min-width: 0;
      border-right: none;
      overflow: visible;
    }
    ::ng-deep .sidenav .mat-drawer-inner-container {
      overflow: visible;
    }
    .mobile-sidenav {
      width: 280px !important;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
    }
    ::ng-deep .mat-drawer-content {
      transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .main-content {
      padding: 24px;
      min-height: calc(100vh - 72px);
      overflow-y: auto;
      box-sizing: border-box;
      background-color: var(--color-background);
    }
    .main-content-footer {
      margin-top: auto;
      padding: 1.25rem 2rem;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      color: #64748b;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .footer-version {
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 8px;
    }
    @media (max-width: 768px) {
      .main-content {
        padding: 16px 12px;
        min-height: calc(100vh - 56px);
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
