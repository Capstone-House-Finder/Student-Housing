export interface RentalRecord {
  id: number;
  student_name: string;
  student_email: string;
  listing_title: string;
  listing_id: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}
