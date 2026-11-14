export type Message = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
};
