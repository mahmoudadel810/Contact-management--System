import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './add-contact.component.html',
  styleUrl: './add-contact.component.css'
})
export class AddContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private router: Router
  ) {
    this.contactForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(10)
      ]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\d{11}$/)  // Exactly 11 digits based on backend validation
      ]],
      address: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50)
      ]],
      notes: ['', [
        Validators.maxLength(200)
      ]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.contactService.addContact(this.contactForm.value).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.successMessage = 'Contact added successfully!';
            // Navigate after a short delay to show success message
            setTimeout(() => {
              this.router.navigate(['/contacts']);
            }, 1500);
          } else {
            this.errorMessage = response.message;
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to add contact. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  goBack(): void {
    this.router.navigate(['/contacts']);
  }

  // Helper method to mark all fields as touched for validation display
  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }
}
