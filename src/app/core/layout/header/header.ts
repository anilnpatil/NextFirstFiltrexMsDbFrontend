// import { Component, input, output } from '@angular/core';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '../../../auth/auth.service';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-header',
//   imports: [RouterModule, CommonModule],
//   templateUrl: './header.html',
//   styleUrl: './header.scss',
// })
// export class Header {
//   // Using Angular signals for reactive inputs/outputs
//   sidebarCollapsed = input.required<boolean>();
//   toggleSidebar = output<void>();

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   logout() {
//     this.authService.logout();
//     this.router.navigate(['/login']);
//   }

//   onToggleSidebar(): void {
//     this.toggleSidebar.emit();
//   }
// }



import { Component, output, input, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { HeaderContentService } from '../../services/header-content.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  toggleSidebar = output<void>();
  pageTitle = input<string>('');
  
  headerContent$ = inject(HeaderContentService).headerContent;
  private navigationService = inject(NavigationService);

  constructor(
    private router: Router,
    private activated: ActivatedRoute
  ) {}

  onToggle(): void {
    this.toggleSidebar.emit();
  }

  onBack(): void {
    this.navigationService.goBack();
  }

  onFilterChange(filter: any, newValue: any): void {
    if (filter.onChange) {
      filter.onChange(newValue);
    }
  }
}

