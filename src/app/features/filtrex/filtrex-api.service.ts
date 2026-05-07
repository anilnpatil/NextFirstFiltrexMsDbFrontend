import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { API_CONFIG } from './api.config';

/*    MODELS  */

export interface LiveData {
  slNo: number;
  sku: number;
  shift: number;
  topCapPressAndHoldTime: number;
  bottomCapPressAndHoldTime: number;
  blockHeightValue: number;
  blockHeightInspectionStatus: number;
  airFlowTestResult: number;
  partStatus: number;
  cycleTime: number; 
  productionDateTime: any;
  productionDate: any;
  clothRefillStatus: number;
  capRefillStatus: number;
  glueRefillStatus: number; 
  
}
export interface ProductionSummary {
  totalProduction: number;
  okParts: number;
  notOkParts: number;
  shift: number;
  sku: string;
  productionDateTime?: string;
}

// Pagination response model
export interface PagedResponse<T> {
  content: T[];

  number: number;          // current page (0-based)
  size: number;            // page size
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface ApiResponse<T> {
  statusCode: string;
  body: T;
}


// SERVICE
@Injectable({
  providedIn: 'root'
})
export class FiltrexApiService {

  constructor(private http: HttpClient) {}

  
  getLiveData(): Observable<LiveData[]> {
    return this.http
      .get<LiveData[]>(API_CONFIG.FILTREX.LIVE_DATA)
      .pipe(shareReplay(1));
  }

  //PRODUCTION SUMMARY (Single object)  
  getProductionSummaryByShift(shift: number): Observable<ProductionSummary> {
    return this.http.get<ProductionSummary>(
      `${API_CONFIG.FILTREX.PRODUCTION_SUMMARY_SHIFT}?shift=${shift}`
    );
  }

  //PAGINATED PRODUCTION REPORT (SPRING PAGE)
  getPagedReportByDateRange(
    start: string,
    end: string,
    page: number,
    size: number,
    shift?: number,
    sku?: string
  ): Observable<PagedResponse<LiveData>> {

    const params: any = {
      start,
      end,
      page,
      size
    };

    if (shift !== undefined) {
      params.shift = shift;
    }

    if (sku !== undefined) {
      params.sku = sku;
    }

    return this.http.get<PagedResponse<LiveData>>(
      API_CONFIG.FILTREX.REPORT_BY_DATE_RANGE,
      { params }
    );
  }
}
