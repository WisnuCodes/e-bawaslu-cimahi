import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, TemplateRef, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.css'
})
export class FilePreviewComponent implements OnChanges, OnDestroy {
  @Input() file: File | null = null;
  @ViewChild('previewDialog') previewDialog!: TemplateRef<unknown>;
  private dialog = inject(MatDialog);
  private sanitizer = inject(DomSanitizer);
  private dialogRef?: MatDialogRef<unknown>;
  url = '';
  pdfUrl: SafeResourceUrl | null = null;
  kind: 'image' | 'pdf' | 'text' | 'audio' | 'video' | 'other' = 'other';
  text = '';
  loading = false;
  failed = false;
  truncated = false;
  zoom = 100;

  get sizeLabel(): string {
    const size = this.file?.size || 0;
    return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`;
  }

  ngOnChanges() {
    this.release();
    this.text = '';
    this.loading = this.failed = this.truncated = false;
    this.zoom = 100;
    this.kind = 'other';
    if (!this.file) return;
    const ext = this.file.name.split('.').pop()?.toLowerCase() || '';
    const imageTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', bmp: 'image/bmp', avif: 'image/avif'
    };
    let mime = this.file.type;
    if (imageTypes[ext]) {
      this.kind = 'image';
      mime = imageTypes[ext];
    } else if (ext === 'pdf' || mime === 'application/pdf') {
      this.kind = 'pdf';
      mime = 'application/pdf';
    } else if (['txt', 'csv', 'json', 'log', 'md'].includes(ext)) {
      this.kind = 'text';
    } else if (mime.startsWith('audio/')) {
      this.kind = 'audio';
    } else if (mime.startsWith('video/')) {
      this.kind = 'video';
    }
    this.url = URL.createObjectURL(this.file.slice(0, this.file.size, mime));
    // Only trust a locally generated blob URL, never a supplied remote URL or HTML.
    if (this.kind === 'pdf') this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    if (this.kind === 'text') this.readText(this.file);
  }

  private async readText(file: File) {
    const currentUrl = this.url;
    this.loading = true;
    try {
      const text = await file.slice(0, 1024 * 1024).text();
      if (this.url !== currentUrl) return;
      this.text = text;
      this.truncated = file.size > 1024 * 1024;
    } catch {
      if (this.url === currentUrl) this.failed = true;
    } finally {
      if (this.url === currentUrl) this.loading = false;
    }
  }

  open() {
    if (!this.file || this.dialogRef) return;
    this.dialogRef = this.dialog.open(this.previewDialog, {
      width: '1040px', maxWidth: '96vw', maxHeight: '94dvh',
      panelClass: 'file-preview-dialog', ariaLabel: `Pratinjau ${this.file.name}`,
      autoFocus: 'first-tabbable', restoreFocus: true
    });
    this.dialogRef.afterClosed().subscribe(() => { this.dialogRef = undefined; this.zoom = 100; });
  }

  close() { this.dialogRef?.close(); }
  changeZoom(delta: number) { this.zoom = Math.min(300, Math.max(50, this.zoom + delta)); }

  private release() {
    this.close();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = '';
    this.pdfUrl = null;
  }

  ngOnDestroy() { this.release(); }
}
