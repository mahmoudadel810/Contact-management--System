import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private lockedContactsSubject = new BehaviorSubject<string[]>([]);
  public lockedContacts$ = this.lockedContactsSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available for socket connection');
      return;
    }

    const socketUrl = environment.apiUrl.replace('/api/v1', '');
    const fullToken = `${environment.tokenPrefix}${token}`;

    this.socket = io(socketUrl, {
      auth: {
        token: fullToken
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    this.socket.on('contact_locked', (data: { contactId: string, userId?: string, lockedBy?: any }) => {
      const currentLocked = this.lockedContactsSubject.value;
      if (!currentLocked.includes(data.contactId)) {
        this.lockedContactsSubject.next([...currentLocked, data.contactId]);
      }
    });

    this.socket.on('contact_unlocked', (data: { contactId: string }) => {
      const currentLocked = this.lockedContactsSubject.value;
      this.lockedContactsSubject.next(currentLocked.filter(id => id !== data.contactId));
    });

    this.socket.on('contact_deleted', (data: { contactId: string, deletedBy: any }) => {
      // Emit a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('contactDeleted', { detail: data }));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.lockedContactsSubject.next([]);
  }

  lockContact(contactId: string): void {
    if (this.socket) {
      this.socket.emit('lock_contact', { contactId });
    }
  }

  unlockContact(contactId: string): void {
    if (this.socket) {
      this.socket.emit('unlock_contact', { contactId });
    }
  }

  isContactLocked(contactId: string): Observable<boolean> {
    return new Observable(observer => {
      this.lockedContacts$.subscribe(lockedContacts => {
        observer.next(lockedContacts.includes(contactId));
      });
    });
  }
} 