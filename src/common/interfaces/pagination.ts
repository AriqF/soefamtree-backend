export interface IPagination<T> {
    rows: T[];
    total_data: number;
    limit: number;
    total_page: number;
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    has_previous_page: boolean;
    has_next_page: boolean;
  }
  