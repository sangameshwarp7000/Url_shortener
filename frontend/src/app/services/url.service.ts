import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlItem } from '../models/url-item';
import { Observable } from 'rxjs';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  private readonly apiUrl = 'http://localhost:3000/api';
  constructor(private http: HttpClient) { }

  shortenUrl(originalUrl: string):Observable<ApiResponse<UrlItem>> {
    return this.http.post<ApiResponse<UrlItem>>(`${this.apiUrl}/shorten`, { 
      originalUrl: originalUrl,
    });
  }

  getUrls(): Observable<ApiResponse<UrlItem[]>> {
    return this.http.get<ApiResponse<UrlItem[]>>(`${this.apiUrl}/urls`);
  }

  deleteUrl(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/${id}`);
  }

}
