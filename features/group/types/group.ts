export type Group = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    name: string;
  } | null;
  members?: {
    id: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }[];
  _count?: {
    members: number;
  };
};
