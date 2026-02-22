import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProcessResponse {
  status: string;
  detected_language: string;
  srt_content: string;
}

@Injectable({ providedIn: 'root' })
export class SubtitleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000';

  processVideo(
    file: File,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Observable<ProcessResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('target_language', targetLanguage);
    if (sourceLanguage) {
      form.append('source_language', sourceLanguage);
    }
    return this.http.post<ProcessResponse>(`${this.apiUrl}/process`, form);
  }
}
