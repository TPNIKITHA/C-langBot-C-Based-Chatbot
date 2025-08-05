
export enum Role {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: string;
  role: Role;
  content: string;
}
