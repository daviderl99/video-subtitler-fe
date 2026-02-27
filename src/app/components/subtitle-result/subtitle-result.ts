import { Component, input } from '@angular/core';
import { LANGUAGES } from '../../languages';

@Component({
  selector: 'app-subtitle-result',
  templateUrl: './subtitle-result.html',
  styleUrl: './subtitle-result.css',
})
export class SubtitleResult {
  readonly srtContent = input.required<string>();
  readonly detectedLanguage = input<string | null>(null);

  get detectedLanguageName(): string {
    const code = this.detectedLanguage();
    if (!code) return '';
    return LANGUAGES.find((l) => l.code === code)?.name ?? code;
  }

  download(): void {
    const content = this.srtContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  }
}
