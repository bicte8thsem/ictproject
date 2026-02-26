// ============================================
// LOGIN PAGE
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import logo from '../../logo.svg';

type AuthErrorShape = {
  message?: string;
  code?: string;
};

function getLoginErrorMessage(error: unknown): string {
  const authError = (typeof error === 'object' && error !== null ? error : {}) as AuthErrorShape;
  const rawMessage = authError.message ?? '';
  const message = rawMessage.toLowerCase();
  const code = (authError.code ?? '').toLowerCase();

  if (message.includes('invalid login credentials') || code === 'invalid_credentials') {
    return 'Wrong email or password.';
  }

  if (message.includes('email not confirmed')) {
    return 'Email is not confirmed yet. Please verify your email first.';
  }

  if (message.includes('supabase is not configured')) {
    return rawMessage;
  }

  return 'Login failed. Please try again.';
}

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      await login(normalizedEmail, data.password);
      navigateTo({ page: 'dashboard' });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-5">
          <img src={logo} alt="Logo" className="h-[104px] w-auto" />
        </div>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Enter Details For Login</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ict@janamaitri.edu.np"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Developed by:{' '}
          <a
            href="https://www.dikshitaphuyal.com.np/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Dixit Phuyal
          </a>{' '}
          &amp; Sabita GC
        </p>
      </div>
    </div>
  );
}
