import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact, ContactResponse, ContactListParams } from '../models/contact.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private baseUrl = `${environment.apiUrl}/contacts`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `${environment.tokenPrefix}${token}`,
      "Content-Type": "application/json"
    });
  }

  getContacts(params: ContactListParams = {}): Observable<ContactResponse> {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<ContactResponse>(`${this.baseUrl}/getContacts`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  getContact(id: string): Observable<ContactResponse> {
    return this.http.get<ContactResponse>(`${this.baseUrl}/getContact/${id}`, {
      headers: this.getHeaders()
    });
  }

  addContact(contact: Contact): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.baseUrl}/addContact`, contact, {
      headers: this.getHeaders()
    });
  }

  updateContact(id: string, contact: Partial<Contact>): Observable<ContactResponse> {
    return this.http.put<ContactResponse>(`${this.baseUrl}/updateContact/${id}`, contact, {
      headers: this.getHeaders()
    });
  }

  deleteContact(id: string): Observable<ContactResponse> {
    return this.http.delete<ContactResponse>(`${this.baseUrl}/deleteContact/${id}`, {
      headers: this.getHeaders()
    });
  }
} 