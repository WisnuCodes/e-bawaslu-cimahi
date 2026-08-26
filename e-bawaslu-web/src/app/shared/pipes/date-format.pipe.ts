import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'bawasluDate',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: any, format: string = 'dd MMMM yyyy, HH:mm'): string | null {
    if (!value) return '-';
    // Gunakan DatePipe bawaan Angular untuk format dasar, tapi pipe ini bisa dikembangkan
    // untuk format custom spesifik Bawaslu (misal: "Hari ini", "Kemarin").
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, format);
  }
}
