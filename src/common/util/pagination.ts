import { IPagination } from "../interfaces/pagination";


export function paginate<T>(rows: T[], total_data: number, page: number, limit: number): IPagination<T> {
  const total_page = Math.ceil(Number(total_data) / Number(limit));
  const pagination: IPagination<T> = {
    rows,
    total_data: Number(total_data),
    limit: Number(limit),
    total_page: Number(total_page),
    current_page: Number(page),
    next_page: Number(page) < total_page ? Number(page) + 1 : null,
    prev_page: total_page > Number(page) && Number(page) > 1 ? Number(page) - 1 : null,
    has_previous_page: Number(page) > 1,
    has_next_page: Number(page) < total_page,
  };
  return pagination;
}
