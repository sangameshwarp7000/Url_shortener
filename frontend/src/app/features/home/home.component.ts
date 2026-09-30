import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UrlService } from '../../services/url.service';
import { UrlItem } from '../../models/url-item';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly urlService = inject(UrlService);
  private readonly formBuilder = inject(FormBuilder);
  readonly urlForm = this.formBuilder.group({
    originalUrl: [
      '', 
      [Validators.required, Validators.pattern(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i)]
    ],
  });
  isSubmitting:boolean = false;
  apiMessage: {type: 'success' | 'danger'; text: string} | null = null;
  createdLink: UrlItem | null  = null;

  get hasUrlError(): boolean {
    const control = this.urlForm.get('originalUrl');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  shortenUrl(){
    if(this.urlForm.invalid){
      this.urlForm.markAllAsTouched();
      return;
    }
    const originalUrl = this.urlForm.value.originalUrl?.trim()??'';
    this.isSubmitting = true;
    this.apiMessage = null;
    this.urlService.shortenUrl(originalUrl).subscribe({
      next: (response) => {
        this.apiMessage = { type: 'success', text: response.message };
        this.createdLink = response.data;
        this.isSubmitting = false;
      },
      error: (error) => {
        this.apiMessage = {
          type: 'danger',
          text: error.error?.message || 'An error occurred while shortening the URL.',
        };
        this.isSubmitting = false;
      },
    });
  }

  async copyLink(shortUrl: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      this.apiMessage = { type: 'success', text: 'Link copied to clipboard!' };
    } catch (error) {
      this.apiMessage = { type: 'danger', text: 'Failed to copy link.' };
    }
  }

}
