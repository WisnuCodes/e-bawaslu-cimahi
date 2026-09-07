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
          <div class="footer-center">
            <a href="https://ppid-cimahikota.bawaslu.go.id/" target="_blank" rel="noopener noreferrer" class="ppid-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              PPID Kota Cimahi
            </a>
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
          <div class="footer-center">
            <a href="https://ppid-cimahikota.bawaslu.go.id/" target="_blank" rel="noopener noreferrer" class="ppid-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              PPID Kota Cimahi
            </a>
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
    .footer-center {
      display: flex;
      align-items: center;
    }
    .ppid-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #ffffff;
      text-decoration: none;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.8rem;
      letter-spacing: 0.3px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
    }
    .ppid-link:hover {
      background: linear-gradient(135deg, #ea580c, #c2410c);
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.45);
      transform: translateY(-1px);
    }
    .ppid-link:active {
      transform: translateY(0);
    }
    .ppid-link svg {
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px 12px;
      }
      .app-footer {
        flex-direction: column;
        gap: 8px;
        text-align: center;
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
      }
      .ppid-link {
        font-size: 0.75rem;
        padding: 5px 12px;
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
