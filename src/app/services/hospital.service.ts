// Hospital service - currently mock-backed. When backend is ready, set `environment.useMock = false` and
// implement HttpClient calls where marked below.
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { Hospital } from '../models/hospital';
import { hospitals } from '../models/hospital';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private hospitals = [...hospitals];
  private hospitals$ = new BehaviorSubject<Hospital[]>(hospitals);

  constructor(private http: HttpClient) { }

  getAll(): Observable<Hospital[]> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.get<Hospital[]>('/api/hospitals');
    }
    return of(this.hospitals);
  }

  getTotal(): Observable<number> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.get<Hospital[]>('/api/hospitals');
    }
    return (this.hospitals$.pipe(
      map(hospitals => hospitals.length)
    ))
  }

  getById(id: string): Observable<Hospital | undefined> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.get<Hospital>(`/api/hospitals/${id}`);
    }
    return of(this.hospitals.find(h => h.id === id));
  }

  create(hospitalData: Omit<Hospital, 'id' | 'created_at' | 'updated_at'>): Observable<Hospital> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.post<Hospital>('/api/hospitals', hospitalData);
    }
    const newHospital: Hospital = {
      ...hospitalData,
      id: `hosp-${this.hospitals.length + 101}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.hospitals.push(newHospital);
    return of(newHospital);
  }

  update(id: string, updateData: Partial<Omit<Hospital, 'id' | 'created_at'>>): Observable<Hospital | undefined> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.patch<Hospital>(`/api/hospitals/${id}`, updateData);
    }
    const index = this.hospitals.findIndex(h => h.id === id);
    if (index === -1) return of(undefined);
    this.hospitals[index] = { ...this.hospitals[index], ...updateData, updated_at: new Date().toISOString() };
    return of(this.hospitals[index]);
  }

  delete(id: string): Observable<boolean> {
    if (!environment.useMock) {
      // TODO: Replace with real backend call, e.g.:
      // return this.http.delete<boolean>(`/api/hospitals/${id}`);
    }
    const initialLength = this.hospitals.length;
    this.hospitals = this.hospitals.filter(h => h.id !== id);
    return of(this.hospitals.length < initialLength);
  }
}
