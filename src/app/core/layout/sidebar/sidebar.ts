// import { Component, inject, input, output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink, RouterLinkActive, Router } from '@angular/router';
// import { AuthService } from '../../../auth/auth.service';

// @Component({
//   standalone: true,
//   selector: 'app-sidebar',
//   imports: [
//     CommonModule,        // ✅ REQUIRED for *ngIf
//     RouterLink,
//     RouterLinkActive
//   ],
//   templateUrl: './sidebar.html',
//   styleUrls: ['./sidebar.scss'],
// })
// export class SidebarComponent {
//   // Using Angular signals for reactive inputs/outputs
//   isCollapsed = input.required<boolean>();
//   toggleSidebar = output<void>();

//   private auth = inject(AuthService);
//   private router = inject(Router);

//   isAdmin(): boolean {
//     return this.auth.hasRole('ADMIN');
//   }

//   isUser(): boolean {
//     return this.auth.hasRole('USER');
//   }

//   logout(): void {
//     this.auth.logout();
//     this.router.navigate(['/login']);
//   }

//   onToggleSidebar(): void {
//     this.toggleSidebar.emit();
//   }
// }



import { Component, input, output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent {
  open = input.required<boolean>();
  close = output<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  isAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.close.emit();
  }
}
