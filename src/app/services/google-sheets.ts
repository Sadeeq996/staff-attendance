import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoogleSheetsService {
  private api = environment.googleSheetsApiUrl;
  private apiKey = environment.googleSheetsApiKey;

  constructor(private http: HttpClient) { }

  list(resource: 'attendance' | 'users' | 'hospitals' | 'roster') {
    const url = `${this.api}?resource=${resource}&action=list&apiKey=${encodeURIComponent(this.apiKey)}`;
    return this.http.get<any>(url).pipe(
      map((r: any) => (r && r.success) ? r.data : []),
      catchError(err => { console.warn('GS list error', err); return of([]); })
    );
  }

  get(resource: string, id: string) {
    const url = `${this.api}?resource=${resource}&action=get&id=${encodeURIComponent(id)}&apiKey=${encodeURIComponent(this.apiKey)}`;
    return this.http.get<any>(url).pipe(
      map((r: any) => (r && r.success) ? r.data : null),
      catchError(err => { console.warn('GS get error', err); return of(null); })
    );
  }

  create(resource: string, data: any) {
    const payload = { resource, action: 'create', data, apiKey: this.apiKey };
    return this.http.post<any>(this.api, payload).pipe(
      map((r: any) => (r && r.success) ? r.data : null),
      catchError(err => { console.warn('GS create error', err); return of(null); })
    );
  }

  update(resource: string, data: any) {
    const payload = { resource, action: 'update', data, apiKey: this.apiKey };
    return this.http.post<any>(this.api, payload).pipe(
      map((r: any) => (r && r.success) ? r.data : null),
      catchError(err => { console.warn('GS update error', err); return of(null); })
    );
  }

  delete(resource: string, id: string) {
    const payload = { resource, action: 'delete', data: { id }, apiKey: this.apiKey };
    return this.http.post<any>(this.api, payload).pipe(
      map((r: any) => (r && r.success) ? r.data : false),
      catchError(err => { console.warn('GS delete error', err); return of(false); })
    );
  }

  uploadImage(base64: string, filename: string) {
    const payload = { action: 'uploadImage', data: { base64, filename }, apiKey: this.apiKey };
    return this.http.post<any>(this.api, payload).pipe(
      map((r: any) => (r && r.success) ? r.url : null),
      catchError(err => { console.warn('GS upload error', err); return of(null); })
    );
  }

  // replace month roster atomic
  replaceMonthRoster(hospitalId: string, year: number, month: number, rows: any[]) {
    const payload = { action: 'replaceRosterMonth', data: { hospitalId, year, month, rows }, apiKey: this.apiKey };
    return this.http.post<any>(this.api, payload).pipe(
      map((r: any) => (r && r.success) ? true : false),
      catchError(err => { console.warn('GS replaceMonthRoster error', err); return of(false); })
    );
  }
}
