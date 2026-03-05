import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.history.push(e.urlAfterRedirects);
      });
  }

  goBack(): void {
    if (this.history.length > 1) {
      this.history.pop();
      const previousUrl = this.history.pop();
      if (previousUrl) {
        this.router.navigateByUrl(previousUrl);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
