import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';
import { FiltrexApiService, ProductionSummary } from '../filtrex-api.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {

  productionData: ProductionSummary = {
    totalProduction: 0,
    okParts: 0,
    notOkParts: 0,
    shift: 0,
    sku: '',
    productionDateTime: undefined
  };

  isLoading = true;
  hasError = false;
  errorMessage = '';
  lastUpdated: string | null = null;

  private destroy$ = new Subject<void>();
  private api = inject(FiltrexApiService);
  private errorService = inject(ErrorService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    interval(2000)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$),
        switchMap(() => this.api.getProductionSummaryByShift(this.getCurrentShift()))
      )
      .subscribe({
        next: (data) => {
          this.productionData = { ...data };
          this.isLoading = false;
          this.hasError = false;
          this.errorMessage = '';
          this.errorService.clearError();
          this.lastUpdated = data.productionDateTime ?? null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Dashboard polling error:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = this.errorService.handleBackendError(error);
          this.errorService.setError(
            this.errorMessage,
            'Please check your internet connection or contact support if the problem persists.'
          );
          this.cdr.markForCheck();
        }
      });
  }

  retryLoad(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.errorService.clearError();
    this.cdr.markForCheck();
  }

  private getCurrentShift(): number {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 6 && hour < 14) {
      return 1; // Morning shift: 6 AM to 2 PM
    } else if (hour >= 14 && hour < 22) {
      return 2; // Afternoon shift: 2 PM to 10 PM
    } else {
      return 3; // Night shift: 10 PM to 6 AM
    }
  }
}
