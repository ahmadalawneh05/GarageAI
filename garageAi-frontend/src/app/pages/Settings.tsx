import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { Save, Lock, Trash2, Moon, Sun, Monitor, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  changePassword as apiChangePassword,
  deleteAccount as apiDeleteAccount,
  getSettings,
  updateProfile,
  updateSettings,
} from '../lib/api';

export function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setEmailNotifications(settings.emailNotifications);
        setMaintenanceReminders(settings.maintenanceReminders);
      })
      .finally(() => setSettingsLoaded(true));
  }, []);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setIsSavingProfile(true);
    try {
      const { user: updated } = await updateProfile(name, email);
      setUser(updated);
      setProfileMessage('Profile updated successfully');
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setPasswordMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setIsDeletingAccount(true);
    try {
      await apiDeleteAccount();
      logout();
      navigate('/', { replace: true });
    } catch {
      setIsDeletingAccount(false);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleToggleEmailNotifications = async (checked: boolean) => {
    setEmailNotifications(checked);
    try {
      await updateSettings({ emailNotifications: checked });
    } catch {
      setEmailNotifications(!checked);
    }
  };

  const handleToggleMaintenanceReminders = async (checked: boolean) => {
    setMaintenanceReminders(checked);
    try {
      await updateSettings({ maintenanceReminders: checked });
    } catch {
      setMaintenanceReminders(!checked);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                {profileMessage && (
                  <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm border border-green-200">
                    {profileMessage}
                  </div>
                )}
                {profileError && (
                  <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                    {profileError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="rounded-lg"
                  />
                </div>

                <Button type="submit" className="rounded-lg gap-2" disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2">Change Password</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your password to keep your account secure
                  </p>

                  {!showPasswordForm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordForm(true)}
                      className="rounded-lg gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                      {passwordMessage && (
                        <div className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm border border-green-200">
                          {passwordMessage}
                        </div>
                      )}
                      {passwordError && (
                        <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                          {passwordError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          className="rounded-lg"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="rounded-lg gap-2" disabled={isChangingPassword}>
                          <Lock className="h-4 w-4" />
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() => setShowPasswordForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="rounded-lg gap-2"
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <h4>Theme</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose Light, Dark, or follow your device setting
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={theme}
                  onValueChange={(value) => value && setTheme(value)}
                  variant="outline"
                  className="rounded-lg"
                >
                  <ToggleGroupItem value="light" aria-label="Light mode" className="gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" aria-label="Dark mode" className="gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </ToggleGroupItem>
                  <ToggleGroupItem value="system" aria-label="System default" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4>Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive diagnostic reports via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={handleToggleEmailNotifications}
                  disabled={!settingsLoaded}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4>Maintenance Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for recommended maintenance
                  </p>
                </div>
                <Switch
                  checked={maintenanceReminders}
                  onCheckedChange={handleToggleMaintenanceReminders}
                  disabled={!settingsLoaded}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
