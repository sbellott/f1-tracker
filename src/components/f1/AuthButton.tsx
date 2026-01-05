import { User, LogOut, Settings, Trophy, Target, Award, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User as UserType } from '@/types';

interface AuthButtonProps {
  user: UserType | null;
  onLogin: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onStandingsClick?: () => void;
  onPredictionsClick?: () => void;
  onBadgesClick?: () => void;
  onSettingsClick?: () => void;
  onAdminClick?: () => void;
}

export function AuthButton({ 
  user, 
  onLogin, 
  onLogout, 
  onProfileClick,
  onStandingsClick,
  onPredictionsClick,
  onBadgesClick,
  onSettingsClick,
  onAdminClick
}: AuthButtonProps) {
  if (!user) {
    return (
      <Button
        onClick={onLogin}
        className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  // Safely get initials with fallback
  const firstName = user.firstName || 'U';
  const lastName = user.lastName || 'U';
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all cursor-pointer bg-transparent border-0 p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {user.stats.badges > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
            >
              {user.stats.badges}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onStandingsClick}>
          <Trophy className="mr-2 h-4 w-4" />
          <span>My Standings</span>
          <Badge variant="secondary" className="ml-auto">
            #{user.stats.rank}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onPredictionsClick}>
          <Target className="mr-2 h-4 w-4" />
          <span>My Predictions</span>
          <Badge variant="secondary" className="ml-auto">
            {user.stats.predictions}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onBadgesClick}>
          <Award className="mr-2 h-4 w-4" />
          <span>Badges</span>
          <Badge variant="secondary" className="ml-auto">
            {user.stats.badges}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onAdminClick}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Admin</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}