import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { SocketService } from '../../services/socket.service';
import { Contact, ContactListParams } from '../../models/contact.model';
import { Observable } from 'rxjs';

interface ContactWithState extends Contact {
  isEditing?: boolean;
  isLocked?: boolean;
}

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css'
})
export class ContactListComponent implements OnInit, OnDestroy {
  // Data Properties
  contacts: ContactWithState[] = [];
  
  // State Properties
  loading = false;
  searchTerm = '';
  
  // Pagination Properties
  totalContacts = 0;
  pageSize = 5;
  currentPage = 0;
  totalPages = 0;
  
  // Editing Properties
  editingContact: ContactWithState | null = null;
  originalContact: ContactWithState | null = null;
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
    this.setupContactDeletedListener();
  }

  ngOnDestroy() {
    if (this.editingContact) {
      this.socketService.unlockContact(this.editingContact._id!);
    }
    this.socketService.disconnect();
    
    // Clean up event listener
    window.removeEventListener('contactDeleted', this.handleContactDeleted.bind(this));
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
          
          this.contacts = contacts;
          this.totalContacts = response.totalCount || response.pagination?.totalContacts || contacts.length;
          this.totalPages = Math.ceil(this.totalContacts / this.pageSize);
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

  getEndContactNumber(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalContacts);
  }

  // Pagination Methods
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadContacts();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 5);
    
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Editing Methods
  startEditing(contact: ContactWithState) {
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
    const index = this.contacts.findIndex(c => c._id === contact._id);
    if (index !== -1) {
      this.contacts[index].isEditing = true;
    }
  }

  saveEdit(contact: ContactWithState) {
    if (!contact._id) return;

    // Only send the editable fields to match backend validation schema
    const updateData = {
      name: contact.name,
      phone: contact.phone,
      address: contact.address,
      notes: contact.notes
    };

    this.contactService.updateContact(contact._id, updateData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Update the contact in the data source
          const index = this.contacts.findIndex(c => c._id === contact._id);
          if (index !== -1) {
            const updatedContact = Array.isArray(response.data) ? response.data[0] : response.data;
            this.contacts[index] = { ...updatedContact, isEditing: false, isLocked: false };
          }

          // Unlock the contact
          this.socketService.unlockContact(contact._id!);
          this.editingContact = null;
          this.originalContact = null;
        }
      },
      error: (error) => {
        console.error('Error updating contact:', error);
        
        // Handle specific error cases
        if (error.status === 404) {
          alert(' Contact Deleted!\n\nThis contact was deleted by another user while you were editing. Your changes could not be saved.');
          // Remove the contact from local list and refresh
          this.loadContacts();
        } else if (error.status === 423) {
          alert('Contact Locked!\n\nThis contact is currently being edited by another user.');
        } else {
          alert('Save Failed!\n\nThere was an error saving your changes. Please try again.');
        }
        
        this.cancelEdit(contact);
      }
    });
  }

  cancelEdit(contact: ContactWithState) {
    if (!contact._id || !this.originalContact) return;

    // Restore original values
    const index = this.contacts.findIndex(c => c._id === contact._id);
    if (index !== -1) {
      this.contacts[index] = { ...this.originalContact, isEditing: false, isLocked: false };
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
          }
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
          
          // Handle specific error cases
          if (error.status === 423) {
            alert('Cannot Delete!\n\nThis contact is currently being edited by another user. Please wait for the editing session to finish before deleting.');
          } else if (error.status === 404) {
            alert('Contact Not Found!\n\nThis contact may have already been deleted.');
            this.loadContacts(); // Refresh the list
          } else {
            alert('Delete Failed!\n\nThere was an error deleting the contact. Please try again.');
          }
        }
      });
    }
  }

  // Socket Event Handlers
  private setupSocketListeners() {
    this.socketService.lockedContacts$.subscribe((lockedContactIds: string[]) => {
      this.lockedContacts = new Set(lockedContactIds);
      
      // Update the locked state of contacts
      this.contacts.forEach((contact, index) => {
        const wasLocked = contact.isLocked;
        const isNowLocked = this.lockedContacts.has(contact._id!);
        
        if (wasLocked !== isNowLocked) {
          this.contacts[index].isLocked = isNowLocked;
        }
      });
    });
  }

  // Real-time Contact Deletion Handler
  private setupContactDeletedListener() {
    window.addEventListener('contactDeleted', this.handleContactDeleted.bind(this));
  }

  private handleContactDeleted(event: any) {
    const { contactId, deletedBy } = event.detail;

    // Check if user was editing this contact
    if (this.editingContact && this.editingContact._id === contactId) {
      alert(`Contact Deleted!\n\nThe contact you were editing was deleted by ${deletedBy.userName}. Your editing session has been cancelled.`);
      
      // Cancel editing
      this.editingContact = null;
      this.originalContact = null;
    }

    // Remove contact from local list
    this.contacts = this.contacts.filter(contact => contact._id !== contactId);
    
    // Update totals
    this.totalContacts = Math.max(0, this.totalContacts - 1);
    this.totalPages = Math.ceil(this.totalContacts / this.pageSize);
    
    // Remove from locked contacts if it was locked
    if (this.lockedContacts.has(contactId)) {
      this.lockedContacts.delete(contactId);
    }
  }

  // Navigation Methods
  navigateToAddContact() {
    this.router.navigate(['/add-contact']);
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
