export interface ReviewReply {
  id: number;
  text: string;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  student_email?: string;
  created_at: string;
  reply?: ReviewReply;
}

export interface Rating {
  average: number;
  count: number;
}
