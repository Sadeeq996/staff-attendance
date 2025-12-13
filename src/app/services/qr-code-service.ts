import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface AttendanceTokenPayload {
  userId: string;
  hospitalId: string;
  timestamp: string;
  random: string;
}

@Injectable({
  providedIn: 'root',
})
export class QrCodeService {

  private readonly STORAGE_KEY = 'attendanceQrToken';

  private qrCodeValueSubject = new BehaviorSubject<string | null>(null);
  public qrCodeValue$: Observable<string | null> = this.qrCodeValueSubject.asObservable();

  constructor(private storage: StorageService) {
    this.loadFromStorage();
  }

  // Load existing QR from storage
  private loadFromStorage() {
    const stored = this.storage.get(this.STORAGE_KEY);
    if (stored) {
      this.qrCodeValueSubject.next(stored.value);
    }
  }

  // Save QR to storage
  private saveToStorage(token: string) {
    this.storage.set(this.STORAGE_KEY, { value: token, timestamp: Date.now() });
    this.qrCodeValueSubject.next(token);
  }

  // Generate a new attendance token
  generateAttendanceToken(userId: string, hospitalId: string): string {
    const payload: AttendanceTokenPayload = {
      userId,
      hospitalId,
      timestamp: new Date().toISOString(),
      random: Math.random().toString(36).substring(2, 12)
    };
    const token = `ATTENDANCE_${btoa(JSON.stringify(payload))}`;
    this.saveToStorage(token);
    return token;
  }

  // Get token from storage or generate new if expired
  getToken(userId: string, hospitalId: string, expiryMs = 300_000): string {
    const stored = this.storage.get(this.STORAGE_KEY);
    if (stored) {
      const age = Date.now() - stored.timestamp;
      if (age < expiryMs) return stored.value; // token still valid
    }
    // otherwise generate a new token
    return this.generateAttendanceToken(userId, hospitalId);
  }

  // Decode token
  decodeToken(token: string): AttendanceTokenPayload | null {
    try {
      if (!token.startsWith("ATTENDANCE_")) return null;
      const base64 = token.replace("ATTENDANCE_", "");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  // Validate token
  validateToken(token: string, hospitalId: string): { valid: boolean; message: string; payload?: AttendanceTokenPayload } {
    const payload = this.decodeToken(token);
    if (!payload) return { valid: false, message: 'Invalid QR format' };
    if (payload.hospitalId !== hospitalId) return { valid: false, message: 'QR code does not belong to this branch' };
    const ageMs = Date.now() - new Date(payload.timestamp).getTime();
    if (ageMs > 300_000) return { valid: false, message: 'QR code expired' };
    return { valid: true, message: 'Valid QR code', payload };
  }

  // Manual regeneration
  regenerateToken(userId: string, hospitalId: string): string {
    return this.generateAttendanceToken(userId, hospitalId);
  }
}
