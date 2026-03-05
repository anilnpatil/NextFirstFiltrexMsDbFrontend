import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, timeout } from 'rxjs';

export type UserRole = 'ADMIN' | 'USER';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = signal(false);
  private role = signal<UserRole | null>(null);
  private token = signal<string | null>(null);

  private apiUrl = 'http://localhost:9091/api/auth'; // Adjust backend URL as needed

  constructor(private http: HttpClient) {
    // Load token from localStorage on service initialization
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token.set(storedToken);
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        this.role.set(payload.role as UserRole);
        this.loggedIn.set(true);
      } catch (e) {
        // Invalid token, clear it
        localStorage.removeItem('token');
      }
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password }).pipe(
      timeout(10000), // 10 second timeout
      tap(response => {
        this.token.set(response.token);
        // Decode token to get role (assuming JWT structure)
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        this.role.set(payload.role as UserRole);
        this.loggedIn.set(true);
        localStorage.setItem('token', response.token);
      }),
      catchError(error => {
        console.error('Login failed', error);
        throw error; // Re-throw the error so it goes to error callback
      })
    );
  }

  register(username: string, password: string, role: UserRole): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password, role }).pipe(
      catchError(error => {
        console.error('Registration failed', error);
        throw error;
      })
    );
  }

  /**
   * Get all users
   * @returns Observable of user list
   */
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Failed to fetch users', error);
        throw error;
      })
    );
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Observable of user details
   */
  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Failed to fetch user', error);
        throw error;
      })
    );
  }

  /**
   * Delete user by ID
   * @param id User ID to delete
   * @returns Observable of deletion response
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Failed to delete user', error);
        throw error;
      })
    );
  }

  logout(): void {
    this.loggedIn.set(false);
    this.role.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  getRole(): UserRole | null {
    return this.role();
  }

  getToken(): string | null {
    return this.token();
  }

  // ✅ REQUIRED FOR SIDEBAR
  hasRole(role: UserRole): boolean {
    return this.role() === role;
  }
}
