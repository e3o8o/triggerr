// Example types
export interface Example {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ExampleStatus = 'pending' | 'in-progress' | 'completed';