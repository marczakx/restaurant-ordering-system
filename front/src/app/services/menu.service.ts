import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CuisineDto, MenuItemDto, MenuItemTypeDto } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = '/api/menu';

  constructor(private http: HttpClient) {}

  getCuisines(): Observable<CuisineDto[]> {
    return this.http.get<CuisineDto[]>(`${this.apiUrl}/cuisines`);
  }

  getMenuItemTypes(): Observable<MenuItemTypeDto[]> {
    return this.http.get<MenuItemTypeDto[]>(`${this.apiUrl}/types`);
  }

  getMenuItems(typeName: string, cuisineId?: number): Observable<MenuItemDto[]> {
    let url = `${this.apiUrl}/items/${typeName}`;
    if (cuisineId) {
      url += `?cuisineId=${cuisineId}`;
    }
    return this.http.get<MenuItemDto[]>(url);
  }

  getAllMenuItems(cuisineId?: number): Observable<MenuItemDto[]> {
    let url = `${this.apiUrl}/items`;
    if (cuisineId) {
      url += `?cuisineId=${cuisineId}`;
    }
    return this.http.get<MenuItemDto[]>(url);
  }

  addMenuItem(menuItem: MenuItemDto): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(`${this.apiUrl}/items`, menuItem);
  }
}
