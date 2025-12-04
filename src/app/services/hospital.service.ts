import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Hospital } from '../models/hospital';
import { hospitals } from '../models/hospital';
import { environment } from '../../environments/environment';
import { GoogleSheetsService } from './google-sheets';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private hospitals = [...hospitals];
  private hospitals$ = new BehaviorSubject<Hospital[]>(hospitals);

  constructor(private gs: GoogleSheetsService) { }

  getAll(): Observable<Hospital[]> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.list('hospitals').pipe(catchError(() => of(this.hospitals)));
    }
    return of(this.hospitals);
  }

  getTotal(): Observable<number> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.list('hospitals').pipe(map(h => (h || []).length), catchError(() => of(this.hospitals.length)));
    }
    return this.hospitals$.pipe(map(h => h.length));
  }

  getById(id: string): Observable<Hospital | undefined> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.get('hospitals', id).pipe(catchError(() => of(this.hospitals.find(h => h.id === id))));
    }
    return of(this.hospitals.find(h => h.id === id));
  }

  create(hospitalData: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>): Observable<Hospital> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      const newHospital: Hospital = {
        ...hospitalData,
        id: `hosp-${Math.floor(Math.random() * 100000)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return this.gs.create('hospitals', newHospital).pipe(map(r => r as Hospital));
    }
    const newHospital: Hospital = {
      ...hospitalData,
      id: `hosp-${this.hospitals.length + 101}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.hospitals.push(newHospital);
    return of(newHospital);
  }

  update(id: string, updateData: Partial<Hospital>): Observable<Hospital | undefined> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      const data = { ...updateData, id };
      return this.gs.update('hospitals', data).pipe(catchError(() => of(undefined)));
    }
    const index = this.hospitals.findIndex(h => h.id === id);
    if (index === -1) return of(undefined);
    this.hospitals[index] = { ...this.hospitals[index], ...updateData, updated_at: new Date().toISOString() };
    return of(this.hospitals[index]);
  }

  delete(id: string): Observable<boolean> {
    if (!environment.useMock && environment.googleSheetsApiUrl) {
      return this.gs.delete('hospitals', id).pipe(map(r => !!r), catchError(() => of(false)));
    }
    const initialLength = this.hospitals.length;
    this.hospitals = this.hospitals.filter(h => h.id !== id);
    return of(this.hospitals.length < initialLength);
  }
}
