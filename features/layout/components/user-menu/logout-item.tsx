import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logout } from '@/app/(auth)/logout/actions';

export function LogoutItem() {
  return (
    <DropdownMenuItem asChild className="cursor-pointer">
      <form action={logout} className="w-full">
        <button
          type="submit"
          className="flex items-center gap-2 py-1.5 text-sm outline-none cursor-pointer"
        >
          <LogOut />
          <span>ログアウト</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
}
