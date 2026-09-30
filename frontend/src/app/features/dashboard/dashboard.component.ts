import { Component, inject, OnInit } from '@angular/core';
import { UrlService } from '../../services/url.service';
import { UrlItem } from '../../models/url-item';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';

type SortOption = 'newest' | 'oldest' | 'most-clicks' | 'least-clicks';
@Component({
  selector: 'app-dashboard',
  imports: [ CommonModule , FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private readonly urlService = inject(UrlService);
  urls: UrlItem[] = [];
  searchTerm: string = '';
  sortBy: SortOption = 'newest';
  isLoading: boolean = false;
  qrLoadingId: number | null = null;
  isDeletingId: number | null = null;
  activeQrId: number | null = null;
  qrImageMap: Record<number, string> = {};
  message: { type: 'success' | 'danger'; text: string } | null = null;
  

  ngOnInit(): void {
    this.loadUrls();
  }

  get filteredUrls(): UrlItem[] {
    const query = this.searchTerm.toLowerCase();
    const filtered = this.urls.filter((url) => {
        if(!query) return true;
        return (
          url.original_url.toLowerCase().includes(query) ||
          url.short_url.toLowerCase().includes(query) ||
          url.short_code.toLowerCase().includes(query)
        );
      });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if(this.sortBy === 'most-clicks') return b.clicks - a.clicks;
      if(this.sortBy === 'least-clicks') return a.clicks - b.clicks;
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return this.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }

  async toggleQr(item: UrlItem) {
    if (this.activeQrId === item.id) {
      this.activeQrId = null;
      return;
    }
    this.activeQrId = item.id;
    if(this.qrImageMap[item.id]){
      return;
    }
    this.qrLoadingId = item.id;
    try{
      const qrDataUrl = await QRCode.toDataURL(item.short_url, {
        width: 220,
        margin: 1,
        color: {
          dark: '#f5663a',
          light: '#0f1113',
        },
      });
      this.qrImageMap[item.id] = qrDataUrl;
    } catch (error) {
      this.message = { type: 'danger', text: 'Failed to generate QR code.' };
      console.error('Error generating QR code:', error);
    } finally {
      this.qrLoadingId = null;
    }
  }

  loadUrls() {
    this.isLoading = true;
    this.urlService.getUrls().subscribe({
      next: (response) => {
        this.urls = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching URLs:', error);
        this.isLoading = false;
      }
    });
  }

  async copyLink(shortUrl: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      this.message = { type: 'success', text: 'Link copied to clipboard!' };
    } catch (error) {
      this.message = { type: 'danger', text: 'Failed to copy link.' };
    }
  }

  async deleteUrl(id: number) {
    if(!confirm('Are you sure you want to delete this URL?')) {
      return;
    }
    this.isDeletingId = id;

    this.urlService.deleteUrl(id).subscribe({
      next: (response) => {
        this.message = { type: 'success', text: response.message }; 
        this.urls = this.urls.filter(url => url.id !== id);
        this.isDeletingId = null;
      },
      error: (error) => {
        this.message = { type: 'danger', text: error.error?.message || 'Failed to delete the URL.' };
        this.isDeletingId = null;
      },
    });
  }

  trackById(index: number, item: UrlItem): number {
    return item.id;
  }

}
