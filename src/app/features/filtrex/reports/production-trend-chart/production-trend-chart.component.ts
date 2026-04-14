import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';

import { ProductionTotalsReportsService } from '../production-totals-reports/production-totals-reports.service';
import { HeaderContentService, FilterConfig } from '../../../../core/services/header-content.service';
import { ProductionTotalsRow, ViewMode } from '../models';

@Component({
  selector: 'app-production-trend-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production-trend-chart.component.html',
  styleUrls: ['./production-trend-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionTrendChartComponent implements OnInit, OnDestroy {

  viewMode: ViewMode = 'DAY';

  fromDate!: string;
  toDate!: string;
  year!: number;

  sku = 0;
  shift = 0;

  loading = false;
  errorMessage: string | null = null;
  private chart?: Chart;
  private destroy$ = new Subject<void>();
  private headerContentService = inject(HeaderContentService);

  constructor(
    private service: ProductionTotalsReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.fromDate = today;
    this.toDate = today;
    this.year = new Date().getFullYear();

    this.setupHeaderFilters();
    this.loadChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.headerContentService.resetHeaderContent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupHeaderFilters(): void {
    const filters: FilterConfig[] = [
      {
        name: 'viewMode',
        type: 'select',
        label: 'View',
        value: this.viewMode,
        options: [
          { label: 'Day', value: 'DAY' },
          { label: 'Week', value: 'WEEK' },
          { label: 'Month', value: 'MONTH' }
        ],
        onChange: (value) => {
          this.viewMode = value;
          this.loadChart();
        }
      },
      {
        name: 'fromDate',
        type: 'date',
        label: 'From',
        value: this.fromDate,
        visible: this.viewMode === 'DAY',
        onChange: (value) => {
          this.fromDate = value;
          this.loadChart();
        }
      },
      {
        name: 'toDate',
        type: 'date',
        label: 'To',
        value: this.toDate,
        visible: this.viewMode === 'DAY',
        onChange: (value) => {
          this.toDate = value;
          this.loadChart();
        }
      },
      {
        name: 'year',
        type: 'number',
        label: 'Year',
        value: this.year,
        visible: this.viewMode !== 'DAY',
        onChange: (value) => {
          this.year = value;
          this.loadChart();
        }
      },
      {
        name: 'sku',
        type: 'select',
        label: 'SKU',
        value: this.sku,
        options: [
          { label: '0) ALL', value: 0 },
          { label: '1) SP210', value: 1 },
          { label: '2) DFC Nano', value: 2 },
          { label: '3) 10" STD MATRIKX models', value: 3 },
          { label: '4) DFC Inline RO', value: 4 },
          { label: '5) Havells carbon block', value: 5 },
          { label: '6) Ecowater078', value: 6 },
          { label: '7) Ecowater108', value: 7 },
          { label: '8) DFC Chemiblock', value: 8 },
          { label: '9) Nova family(I Nova & G nova)', value: 9 },
          { label: '10) Livpure', value: 10 },
          { label: '11) Ecowater055', value: 11 },
          { label: '12) DFC MCHPS', value: 12 },
          { label: '13) Aquatru pre', value: 13 },
          { label: '14) Aquatru post', value: 14 }
          // other SKUs can be added dynamically by skuOptions
        ],
           onChange: (value) => {
           this.sku = value;
           this.loadChart();
         }
      },
      {
        name: 'shift',
        type: 'select',
        label: 'Shift',
        placeholder: 'ALL',
        value: this.shift,
        options: [
          { label: 'ALL', value: 0 },
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 }
        ],
        onChange: (value) => {
          this.shift = value;
          this.loadChart();
        }
      },
      {
        name: 'apply',
        type: 'button',
        label: this.loading ? 'Loading...' : 'Apply',
        disabled: this.loading,
        onChange: () => this.loadChart()
      }
    ];

    this.headerContentService.setFilters(filters);
  }

  loadChart(): void {
    this.loading = true;
    this.errorMessage = null;
    this.updateFilterButtons();

    this.service.fetchTotals(this.viewMode, {
      fromDate: this.fromDate,
      toDate: this.toDate,
      year: this.year,
      sku: this.sku,
      shift: this.shift
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: rows => {
        this.buildChart(rows || []);
        this.loading = false;
        this.updateFilterButtons();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;        
        // prefer server-provided message when available        
        // console.error('Failed to load production totals', err);
        this.errorMessage = err?.message ?? 'Failed to load production data. Please try again.';
        this.updateFilterButtons();
        this.cdr.markForCheck();
      }
    });
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

  private buildChart(rows: ProductionTotalsRow[]): void {
    const labels = rows.map(r => r.periodKey);

    const totalCounts = rows.map(r => r.totalCount);
    const okCounts = rows.map(r => r.okCount);
    const notOkCounts = rows.map(r => r.notOkCount);

    // 🔥 percentage maps (index-based)
    const okPerc = rows.map(r =>
      r.totalCount ? +(r.okCount / r.totalCount * 100).toFixed(1) : 0
    );

    const notOkPerc = rows.map(r =>
      r.totalCount ? +(r.notOkCount / r.totalCount * 100).toFixed(1) : 0
    );

    this.chart?.destroy();

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total',
            data: totalCounts,
            backgroundColor: '#facc15'
          },
          {
            label: 'OK',
            data: okCounts,
            backgroundColor: '#22c55e'
          },
          {
            label: 'NOT OK',
            data: notOkCounts,
            backgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const index = ctx.dataIndex;
                const label = ctx.dataset.label;
                const value = ctx.parsed.y;

                if (label === 'OK') {
                  return `OK: ${value} (${okPerc[index]}%)`;
                }

                if (label === 'NOT OK') {
                  return `NOT OK: ${value} (${notOkPerc[index]}%)`;
                }

                return `Total: ${value} (100%)`;
              }
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text:
                this.viewMode === 'DAY'
                  ? 'Date'
                  : this.viewMode === 'WEEK'
                  ? 'Week'
                  : 'Month'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Production Count'
            }
          }
        }
      }
    };

    this.chart = new Chart('productionTrendChart', config);
  }
}
