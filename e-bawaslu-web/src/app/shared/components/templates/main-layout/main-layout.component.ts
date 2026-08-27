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
    <!-- DESKTOP: Flexbox layout -->
    <div class="desktop-layout" *ngIf="!isMobile">
      <app-sidebar #sidebarRef></app-sidebar>
      <div class="desktop-main">
        <app-header [isMobile]="false"></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <footer class="app-footer">
          <div class="footer-left">
            <span class="footer-brand">SIMBA CIMAHI</span>
            <span class="footer-version">v2.0.0</span>
          </div>
          <div class="footer-right">
            &copy; 2026 Badan Pengawas Pemilihan Umum Kota Cimahi
          </div>
        </footer>
      </div>
    </div>

    <!-- MOBILE: Angular Material Sidenav overlay -->
    <mat-sidenav-container class="sidenav-container" *ngIf="isMobile">
      <mat-sidenav
        #sidenav
        mode="over"
        [fixedInViewport]="true"
        class="mobile-sidenav">
        <app-sidebar></app-sidebar>
      </mat-sidenav>
      <mat-sidenav-content>
        <app-header
          [isMobile]="true"
          (toggleMenu)="sidenav.toggle()">
        </app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <footer class="app-footer">
          <div class="footer-left">
            <span class="footer-brand">SIMBA CIMAHI</span>
            <span class="footer-version">v2.0.0</span>
          </div>
          <div class="footer-right">
            &copy; 2026 Bawaslu Kota Cimahi
          </div>
        </footer>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    /* === DESKTOP FLEXBOX LAYOUT === */
    .desktop-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .desktop-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .main-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      box-sizing: border-box;
      background-color: var(--color-background);
    }

    /* === MOBILE SIDENAV === */
    .sidenav-container {
      height: 100vh;
    }
    .mobile-sidenav {
      width: 280px;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
    }

    /* === FOOTER === */
    .app-footer {
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      color: #64748b;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
    }
    .footer-right {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px 12px;
      }
      .app-footer {
        flex-direction: column;
        gap: 4px;
        text-align: center;
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
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
