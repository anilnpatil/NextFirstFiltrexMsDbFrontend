import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  FiltrexApiService,
  LiveData,
  PagedResponse
} from '../../filtrex-api.service';
import { HeaderContentService, FilterConfig } from '../../../../core/services/header-content.service';
import { ReportFullscreenService } from '../../../../core/services/report-fullscreen.service';

@Component({
  selector: 'app-view-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-report.component.html',
  styleUrls: ['./view-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewReportComponent implements OnInit, OnDestroy {

  startDate: string = '';
  endDate: string = '';
  shift = 'ALL';
  sku = 'ALL';

  data: LiveData[] = [];
  loading = false;
  errorMessage: string | null = null;

  /** Pagination */
  page = 0;
  size = 15;
  totalElements = 0;
  totalPages = 0;

  private destroy$ = new Subject<void>();
  private api = inject(FiltrexApiService);
  private cdr = inject(ChangeDetectorRef);
  private headerContentService = inject(HeaderContentService);
  private reportFullscreenService = inject(ReportFullscreenService);
  isReportFullscreen = this.reportFullscreenService.isFullscreen;

  ngOnInit(): void {
    this.reportFullscreenService.setFullscreen(true);

    const today = this.formatDate(new Date());
    this.startDate = today;
    this.endDate = today;

    this.setupHeaderFilters();
    this.fetchData(true);
  }

  ngOnDestroy(): void {
    this.reportFullscreenService.setFullscreen(false);
    this.headerContentService.resetHeaderContent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupHeaderFilters(): void {
    const filters: FilterConfig[] = [
      {
        name: 'startDate',
        type: 'date',
        label: 'From',
        value: this.startDate,
        onChange: (value) => {
          this.startDate = value;
        }
      },
      {
        name: 'endDate',
        type: 'date',
        label: 'To',
        value: this.endDate,
        onChange: (value) => {
          this.endDate = value;
        }
      },
      {
        name: 'sku',
        type: 'select',
        label: 'SKU',
        placeholder: 'ALL',
        value: this.sku,
        options: [
          { label: 'ALL', value: 'ALL' },
          { label: 'DFC Inline RO', value: 'DFC Inline RO' },
          { label: 'gold', value: 'gold' },
          { label: 'silver', value: 'silver' }
        ],
        onChange: (value) => {
          this.sku = value;          
        }
      },
      {
        name: 'shift',
        type: 'select',
        label: 'Shift',
        placeholder: 'ALL',
        value: this.shift,
        options: [
          { label: 'ALL', value: 'ALL' },
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' }
        ],
        onChange: (value) => {
          this.shift = value;         
        }
      },
      {
        name: 'apply',
        type: 'button',
        label: this.loading ? 'Loading...' : 'Apply',
        disabled: this.loading,
        onChange: () => this.apply()
      }
    ];

    this.headerContentService.setFilters(filters);
  }

  private updateFilterButtons(): void {
    const currentFilters = this.headerContentService.headerContent().filters;
    if (currentFilters && currentFilters.length > 0) {
      const applyBtn = currentFilters.find(f => f.name === 'apply');
      if (applyBtn) {
        applyBtn.label = this.loading ? 'Loading...' : 'Apply';
        applyBtn.disabled = this.loading;
      }
    }
  }

  /** Apply filters */
  apply(): void {
    this.page = 0;
    this.fetchData(true);
  }

  /** Previous page */
  prev(): void {
    if (this.page > 0) {
      this.page--;
      this.fetchData(false);
    }
  }

  /** Next page */
  next(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.fetchData(false);
    }
  }

  /** Core loader */
  private fetchData(reset: boolean): void {
    this.loading = true;
    this.errorMessage = null;
    this.updateFilterButtons();

    const start = this.startDate || this.endDate;
    const end = this.endDate || this.startDate;
    const shiftValue = this.shift === 'ALL' ? undefined : Number(this.shift);
    const skuValue = this.sku === 'ALL' ? undefined : String(this.sku);

    this.api
      .getPagedReportByDateRange(
        start,
        end,
        this.page,
        this.size,
        shiftValue,
        skuValue
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: PagedResponse<LiveData>) => {
          this.page = res.number;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          // For traditional pagination we should replace the page data
          // instead of appending; this keeps the UI consistent when
          // navigating pages.
          this.data = res.content;

          this.loading = false;
          this.errorMessage = null;
          this.updateFilterButtons();
          this.cdr.markForCheck();

          // After DOM updates, ensure the table wrapper scrolls to top so
          // the user sees the beginning of the page and pagination/info.
          setTimeout(() => this.scrollToTop(), 0);
        },
        error: (err) => {
          // show friendly error message when backend is unavailable
          // eslint-disable-next-line no-console
          console.error('Report fetch error', err);
          this.data = [];
          this.loading = false;
          this.errorMessage = err?.message ?? 'Failed to load report data. Please try again or adjust your filters.';
          this.updateFilterButtons();
          this.cdr.markForCheck();
        }
      });
  }

  /** Ensure the table wrapper is scrolled to show the top of the page */
  private scrollToTop(): void {
    try {
      const wrapper = document.querySelector('.table-wrapper') as HTMLElement | null;
      if (wrapper) {
        wrapper.scrollTop = 0;
      } else {
        // fallback: scroll window to top of the report area
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('scrollToTop failed', e);
    }
  }

  /** Date helper */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

