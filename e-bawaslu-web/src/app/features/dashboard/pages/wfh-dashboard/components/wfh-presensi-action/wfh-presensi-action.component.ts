import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent } from '../../../../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'app-wfh-presensi-action',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, ButtonComponent],
  templateUrl: './wfh-presensi-action.component.html',
  styleUrl: './wfh-presensi-action.component.css'
})
export class WfhPresensiActionComponent implements OnDestroy {
  @Input() isCheckedIn = false;
  @Input() isCheckedOut = false;
  @Input() currentTime: Date = new Date();
  @Input() isCheckingIn = false;
  @Input() isCheckingOut = false;
  @Input() isGettingLocation = false;
  @Input() isCameraOpen = false;
  @Input() captureMode: 'checkin' | 'checkout' = 'checkin';
  @Input() isCheckoutDisabled = false;

  @Output() openCamera = new EventEmitter<'checkin' | 'checkout'>();
  @Output() stopCamera = new EventEmitter<void>();
  @Output() capturePhotoEvent = new EventEmitter<File>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private mediaStream: MediaStream | null = null;

  ngOnDestroy() {
    this.stopLocalCamera();
  }

  onOpenCamera(mode: 'checkin' | 'checkout') {
    this.openCamera.emit(mode);
    // Let angular render the video element first
    setTimeout(() => {
      this.startLocalCamera();
    }, 100);
  }

  private startLocalCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          this.mediaStream = stream;
          if (this.videoElement && this.videoElement.nativeElement) {
            this.videoElement.nativeElement.srcObject = stream;
            this.videoElement.nativeElement.play();
          }
        })
        .catch(err => {
          console.error('Gagal mengakses kamera:', err);
          // Could emit an error event here
        });
    }
  }

  private stopLocalCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  onStopCamera() {
    this.stopLocalCamera();
    this.stopCamera.emit();
  }

  onCapturePhoto() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;

    const MAX_WIDTH = 600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID');
      const timestampText = `${dateStr} ${timeStr}`;

      ctx.font = 'bold 14px Arial';
      const padding = 8;
      const textWidth = ctx.measureText(timestampText).width;
      const rectHeight = 24;
      
      const x = canvas.width - textWidth - (padding * 2) - 10;
      const y = canvas.height - rectHeight - 10;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect ? ctx.roundRect(x, y, textWidth + (padding * 2), rectHeight, 4) : ctx.fillRect(x, y, textWidth + (padding * 2), rectHeight);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(timestampText, x + padding, y + 17);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
          this.stopLocalCamera();
          this.stopCamera.emit(); // Inform parent to close camera view
          this.capturePhotoEvent.emit(file);
        }
      }, 'image/jpeg', 0.7);
    }
  }
}
