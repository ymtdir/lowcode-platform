import type { Prisma } from '@prisma/client';

/**
 * グループ型（Prisma.GroupGetPayloadを使用）
 */
export type Group = Prisma.GroupGetPayload<{
  include: {
    parent: {
      select: {
        name: true;
      };
    };
    members: {
      include: {
        user: {
          select: {
            id: true;
            email: true;
            name: true;
          };
        };
      };
    };
    _count: {
      select: {
        members: true;
      };
    };
  };
}>;
