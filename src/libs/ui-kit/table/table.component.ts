import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

// Column configuration model
export interface TableColumn {
  key: string;
  header: string;
  type:
    | 'text'
    | 'image'
    | 'badge'
    | 'score'
    | 'status'
    | 'action'
    | 'toggle'
    | 'sno'
    | 'currency'
    | 'date';
  sortable?: boolean;
  width?: string;
  imageKey?: string;
  badgeKey?: string;
  badgeColorKey?: string;
  scoreColorFn?: (value: number) => string;
  statusColorMap?: Record<string, string>;
  currencySymbol?: string;
  dateFormat?: string;
}

// Action button model
export interface TableAction {
  icon: string;
  name?: string;
  color?: string;
  toolTip?: string;
  actionKey: string;
}

// Row action event model
export interface RowActionEvent {
  action: TableAction;
  row: Record<string, unknown>;
}

// Toggle change event model
export interface ToggleChangeEvent {
  checked: boolean;
  row: Record<string, unknown>;
}

@Component({
  selector: 'gwx-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    NgOptimizedImage,
  ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Signal Inputs
  columns = input<TableColumn[]>([]);
  data = input<Record<string, unknown>[]>([]);
  pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  pageSize = input(10);
  pageLength = input(0);
  currentPage = input(0);
  showPagination = input(true);
  noDataMessage = input('No Data');
  highlightRowFn = input<((row: Record<string, unknown>) => string) | undefined>(undefined);

  // Signal Outputs
  pageChange = output<PageEvent>();
  sortChange = output<Sort>();
  actionClick = output<RowActionEvent>();
  toggleChange = output<ToggleChangeEvent>();
  rowClick = output<Record<string, unknown>>();

  // Internal state
  private readonly dataSourceSignal = signal<MatTableDataSource<Record<string, unknown>>>(
    new MatTableDataSource<Record<string, unknown>>(),
  );

  // Computed properties
  displayedColumns = computed(() => this.columns().map((col) => col.key));
  hasData = computed(() => this.data().length > 0);
  emptyData = computed(() => new MatTableDataSource<Record<string, unknown>>([{ empty: true }]));

  get dataSource(): MatTableDataSource<Record<string, unknown>> {
    return this.dataSourceSignal();
  }

  ngOnInit(): void {
    this.dataSourceSignal.set(new MatTableDataSource(this.data()));
  }

  ngAfterViewInit(): void {
    const ds = this.dataSourceSignal();
    if (ds) {
      ds.paginator = this.paginator;
      ds.sort = this.sort;
    }
  }

  handlePageEvent(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  handleSortChange(sortState: Sort): void {
    this.sortChange.emit(sortState);
  }

  onActionClick(action: TableAction, row: Record<string, unknown>): void {
    this.actionClick.emit({ action, row });
  }

  onToggleChange(event: { checked: boolean }, row: Record<string, unknown>): void {
    this.toggleChange.emit({ checked: event.checked, row });
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  getRowHighlight(row: Record<string, unknown>): string {
    const fn = this.highlightRowFn();
    if (fn) {
      return fn(row);
    }
    return '';
  }

  getScoreColor(column: TableColumn, value: number): string {
    if (column.scoreColorFn) {
      return column.scoreColorFn(value);
    }
    if (value >= 70) return '#22c55e';
    if (value >= 50) return '#f59e0b';
    if (value >= 30) return '#ef4444';
    return '#6b7280';
  }

  getStatusColor(column: TableColumn, value: string): string {
    if (column.statusColorMap?.[value]) {
      return column.statusColorMap[value];
    }
    const defaultColors: Record<string, string> = {
      Sent: '#3b82f6',
      Draft: '#6b7280',
      Overdue: '#ef4444',
      Pending: '#f59e0b',
      Paid: '#22c55e',
      Cancelled: '#ef4444',
    };
    return defaultColors[value] || '#6b7280';
  }

  getBadgeBackground(color: string): string {
    return color + '1a';
  }

  formatCurrency(value: number, symbol = '$'): string {
    return `${symbol}${value?.toLocaleString() || '0'}`;
  }

  trackByColumn(index: number, column: TableColumn): string {
    return column.key;
  }

  trackByRow(index: number, row: Record<string, unknown>): string | number {
    return (row['id'] as string | number) || index;
  }

  trackByAction(index: number, action: TableAction): string {
    return action.actionKey;
  }
}
