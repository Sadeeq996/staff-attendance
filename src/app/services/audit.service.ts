import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface AuditEvent {
    id: string;
    actorId?: number; // admin user id
    action: string;
    resourceType: string;
    resourceId?: string | number;
    timestamp: string;
    before?: any;
    after?: any;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
    private readonly KEY = 'audit_events_v1';

    constructor(private storage: StorageService) {
        if (!this.storage.get(this.KEY)) this.storage.set(this.KEY, []);
    }

    list(): AuditEvent[] {
        return this.storage.get(this.KEY) || [];
    }

    log(event: Omit<AuditEvent, 'id' | 'timestamp'> & { id?: string }) {
        const arr = this.list();
        const e = {
            id: event.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date().toISOString(),
            ...event,
        } as AuditEvent;
        arr.push(e);
        this.storage.set(this.KEY, arr);
        return e;
    }
}
