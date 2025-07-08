import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContactService } from '../../services/contact.service';
import { SocketService } from '../../services/socket.service';
import { Contact, ContactListParams } from '../../models/contact.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css'
})
export class ContactListComponent implements OnInit, OnDestroy {
  // Data Properties
  dataSource = new MatTableDataSource<Contact>([]);
  filteredContacts: Contact[] = [];
  displayedColumns: string[] = ['name', 'phone', 'address', 'notes', 'actions'];
  
  // State Properties
  loading = false;
  searchTerm = '';
  
  // Pagination Properties
  totalContacts = 0;
  pageSize = 5;
  currentPage = 0;
  
  // Editing Properties
  editingContact: Contact | null = null;
  originalContact: Contact | null = null;
  lockedContacts: Set<string> = new Set();

  constructor(
    private contactService: ContactService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.socketService.connect();
    this.loadContacts();
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    if (this.editingContact) {
      this.socketService.unlockContact(this.editingContact._id!);
    }
    this.socketService.disconnect();
  }

  // Data Loading Methods
  loadContacts() {
    this.loading = true;
    
    const params: ContactListParams = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      search: this.searchTerm || undefined
    };

    this.contactService.getContacts(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle both single contact and array of contacts
          const contactsArray = Array.isArray(response.data) ? response.data : [response.data];
          
          const contacts = contactsArray.map((contact: Contact) => ({
            ...contact,
            isEditing: false,
            isLocked: this.lockedContacts.has(contact._id!)
          }));
          
          this.dataSource.data = contacts;
          this.filteredContacts = contacts;
          this.totalContacts = response.totalCount || response.pagination?.totalContacts || contacts.length;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.loading = false;
      }
    });
  }

  // Search Methods
  onSearch() {
    this.currentPage = 0;
    this.loadContacts();
  }

  // Utility Methods
  getInitials(name: string): string {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  // Pagination Methods
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadContacts();
  }

  // Editing Methods
  startEditing(contact: Contact) {
    if (this.lockedContacts.has(contact._id!)) {
      return;
    }

    // Cancel any existing edit
    if (this.editingContact) {
      this.cancelEdit(this.editingContact);
    }

    // Lock the contact
    this.socketService.lockContact(contact._id!);
    
    // Set up editing state
    this.editingContact = contact;
    this.originalContact = { ...contact };
    
    // Update contact state
    const index = this.dataSource.data.findIndex(c => c._id === contact._id);
    if (index !== -1) {
      this.dataSource.data[index].isEditing = true;
      this.dataSource._updateChangeSubscription();
    }
  }

  saveEdit(contact: Contact) {
    if (!contact._id) return;

    this.contactService.updateContact(contact._id, contact).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update the contact in the data source
          const index = this.dataSource.data.findIndex(c => c._id === contact._id);
          if (index !== -1) {
            const updatedContact = Array.isArray(response.data) ? response.data[0] : response.data;
            this.dataSource.data[index] = { ...updatedContact, isEditing: false, isLocked: false };
            this.dataSource._updateChangeSubscription();
          }

          // Unlock the contact
          this.socketService.unlockContact(contact._id!);
          this.editingContact = null;
          this.originalContact = null;
          
          console.log('Contact updated successfully');
        }
      },
      error: (error) => {
        console.error('Error updating contact:', error);
        this.cancelEdit(contact);
      }
    });
  }

  cancelEdit(contact: Contact) {
    if (!contact._id || !this.originalContact) return;

    // Restore original values
    const index = this.dataSource.data.findIndex(c => c._id === contact._id);
    if (index !== -1) {
      this.dataSource.data[index] = { ...this.originalContact, isEditing: false, isLocked: false };
      this.dataSource._updateChangeSubscription();
    }

    // Unlock the contact
    this.socketService.unlockContact(contact._id);
    this.editingContact = null;
    this.originalContact = null;
  }

  // Delete Methods
  deleteContact(contactId: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contactService.deleteContact(contactId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadContacts();
            console.log('Contact deleted successfully');
          }
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
        }
      });
    }
  }

  // Socket Event Handlers
  private setupSocketListeners() {
    // Listen to the existing lockedContacts observable
    this.socketService.lockedContacts$.subscribe((lockedContactIds: string[]) => {
      this.lockedContacts = new Set(lockedContactIds);
      
      // Update the locked state of contacts in the table
      this.dataSource.data.forEach((contact, index) => {
        const wasLocked = contact.isLocked;
        const isNowLocked = this.lockedContacts.has(contact._id!);
        
        if (wasLocked !== isNowLocked) {
          this.dataSource.data[index].isLocked = isNowLocked;
        }
      });
      
      if (this.dataSource.data.length > 0) {
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  // Create observables for individual contact lock events
  onContactLocked(): Observable<string> {
    return new Observable(observer => {
      this.socketService.lockedContacts$.subscribe(lockedContacts => {
        lockedContacts.forEach(contactId => {
          if (!this.lockedContacts.has(contactId)) {
            observer.next(contactId);
          }
        });
      });
    });
  }

  onContactUnlocked(): Observable<string> {
    return new Observable(observer => {
      this.socketService.lockedContacts$.subscribe(lockedContacts => {
        this.lockedContacts.forEach(contactId => {
          if (!lockedContacts.includes(contactId)) {
            observer.next(contactId);
          }
        });
      });
    });
  }

  // Navigation Methods
  navigateToAddContact() {
    this.router.navigate(['/contacts/add']);
  }

  logout() {
    if (this.editingContact) {
      this.socketService.unlockContact(this.editingContact._id!);
    }
    localStorage.removeItem('token');
    this.socketService.disconnect();
    this.router.navigate(['/login']);
  }
}
