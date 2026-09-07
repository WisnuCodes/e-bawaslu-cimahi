import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FilePreviewComponent } from './file-preview.component';

describe('FilePreviewComponent', () => {
  let fixture: ComponentFixture<FilePreviewComponent>;
  let component: FilePreviewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilePreviewComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(FilePreviewComponent);
    component = fixture.componentInstance;
  });

  function select(file: File | null) {
    fixture.componentRef.setInput('file', file);
    fixture.detectChanges();
  }

  it('recognizes PDFs with missing MIME metadata and uses a local blob URL', () => {
    select(new File(['%PDF-1.4'], 'laporan.PDF'));
    expect(component.kind).toBe('pdf');
    expect(component.url.startsWith('blob:')).toBeTrue();
    expect(component.pdfUrl).not.toBeNull();
  });

  it('releases the previous preview when replacing or clearing a file', () => {
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    select(new File(['first'], 'first.pdf'));
    const firstUrl = component.url;
    select(new File(['second'], 'second.pdf'));
    expect(revoke).toHaveBeenCalledWith(firstUrl);
    const secondUrl = component.url;
    select(null);
    expect(revoke).toHaveBeenCalledWith(secondUrl);
    expect(component.url).toBe('');
    expect(component.pdfUrl).toBeNull();
    expect(fixture.nativeElement.querySelector('.file-card')).toBeNull();
  });

  it('opens an accessible dialog for unsupported documents and provides a download', async () => {
    select(new File(['document'], 'laporan.docx'));
    fixture.nativeElement.querySelector('.file-summary').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Pratinjau laporan.docx');
    expect(overlay.textContent).toContain('belum dapat ditampilkan');
    expect(overlay.querySelector('a[download]')?.getAttribute('download')).toBe('laporan.docx');
    component.close();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not embed HTML or SVG uploads as executable documents', () => {
    select(new File(['<svg onload="alert(1)"></svg>'], 'image.svg', { type: 'image/svg+xml' }));
    expect(component.kind).toBe('other');
    expect(component.pdfUrl).toBeNull();
    select(new File(['<script>alert(1)</script>'], 'document.html', { type: 'text/html' }));
    expect(component.kind).toBe('other');
  });

  it('ignores a slow text read after the selected file changes', async () => {
    let resolveText!: (value: string) => void;
    const oldFile = new File(['old'], 'old.txt');
    const blob = new Blob(['old']);
    spyOn(blob, 'text').and.returnValue(new Promise(resolve => { resolveText = resolve; }));
    spyOn(oldFile, 'slice').and.returnValue(blob);
    select(oldFile);
    select(new File(['%PDF'], 'new.pdf'));
    resolveText('stale contents');
    await fixture.whenStable();
    expect(component.kind).toBe('pdf');
    expect(component.text).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('limits image zoom and releases the active URL on destruction', () => {
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    select(new File(['image'], 'photo.png', { type: 'image/png' }));
    component.changeZoom(1000);
    expect(component.zoom).toBe(300);
    component.changeZoom(-1000);
    expect(component.zoom).toBe(50);
    const url = component.url;
    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith(url);
  });
});
