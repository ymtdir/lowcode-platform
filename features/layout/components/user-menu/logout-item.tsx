import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logout } from '@/app/(auth)/logout/actions';

export function LogoutItem() {
  return (
    <DropdownMenuItem asChild>
      <form action={logout} className="w-full">
        <button
          type="submit"
          className="flex items-center gap-2 py-1.5 text-sm outline-none"
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
}
