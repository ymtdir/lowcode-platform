import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logout } from '@/features/auth/api';

/**
 * ログアウトオプションコンポーネント
 */
export function LogoutOption() {
  return (
    <DropdownMenuItem asChild>
      <form action={logout} className="w-full">
        <button
          type="submit"
          className="flex items-center gap-2 text-sm outline-none cursor-pointer"
        >
          <LogOut />
          <span>ログアウト</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
}
