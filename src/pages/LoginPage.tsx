// ============================================
// LOGIN PAGE - HOD SECURE PORTAL
// ============================================

import { useState, type MouseEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import logo from '../../logo.svg';

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showOtpField, setShowOtpField] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

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

  const handleButtonRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id));
    }, 550);
  };

  const onSubmit = async (data: LoginSchema) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await login(data.email, data.password);
      navigateTo({ page: 'dashboard' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('invalid login credentials')) {
        setError('Wrong email or password.');
      } else {
        setError('Wrong email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const particles = [
    { left: '10%', top: '12%', delay: '0s', duration: '8s' },
    { left: '26%', top: '28%', delay: '1.3s', duration: '9s' },
    { left: '42%', top: '58%', delay: '0.8s', duration: '10s' },
    { left: '68%', top: '20%', delay: '1.8s', duration: '11s' },
    { left: '82%', top: '70%', delay: '0.4s', duration: '9.5s' },
    { left: '58%', top: '82%', delay: '2.2s', duration: '12s' },
  ];

  return (
    <div
      className="min-h-screen login-fade-in font-['Inter','SF_Pro_Display','Segoe_UI',sans-serif]"
      style={{ background: '#0B1E3D' }}
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between login-split-bg p-12 xl:p-16">
          <div className="absolute inset-0 login-mesh-layer" aria-hidden />
          <div className="absolute inset-0 login-waves-layer" aria-hidden />
          {particles.map((particle, index) => (
            <span
              key={`${particle.left}-${particle.top}`}
              className="login-particle"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                width: index % 2 === 0 ? '7px' : '5px',
                height: index % 2 === 0 ? '7px' : '5px',
              }}
              aria-hidden
            />
          ))}

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-[#A8C0D8] backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-[#00D4FF]" />
              Authorized Administrative Access
            </div>
            <h1 className="mt-8 text-[32px] font-semibold leading-tight text-white">
              Janamaitri Multiple Campus
            </h1>
            <p className="mt-2 text-lg text-[#A8C0D8]">Department of ICT</p>
            <p className="mt-8 text-sm leading-7 text-[#A8C0D8]">
              HOD managed academic system for faculty and staff operations, protected by secure institutional
              authentication controls.
            </p>
          </div>

          <div className="relative z-10 text-xs tracking-[0.28em] text-[#A8C0D8] uppercase">
            HOD Secure Administrative Console
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md rounded-[18px] border border-white/20 bg-white/10 p-6 shadow-[0_25px_50px_rgba(0,0,0,0.25)] backdrop-blur-[20px] sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <img src={logo} alt="JMC Logo" className="h-24 w-auto" />
              <h2 className="mt-4 text-[26px] font-semibold text-white">HOD Secure Portal</h2>
              <p className="mt-1 text-sm text-[#A8C0D8]">Restricted Access - Authorized Personnel Only</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 border-red-400/40 bg-red-500/15 text-white">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-normal text-[#A8C0D8]">
                  Institutional Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8C0D8]/80" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="hod@janamaitri.edu.np"
                      className={`h-12 rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] pl-10 text-[15px] font-medium text-white placeholder:text-[#A8C0D8]/60 transition-all duration-300 focus:border-[#00D4FF]/70 focus:ring-2 focus:ring-[#00D4FF]/30 ${
                        errors.email ? 'login-shake border-red-400/70' : ''
                      }`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                      {...register('email')}
                    />
                </div>
                {errors.email && <p className="text-xs text-red-200">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-normal text-[#A8C0D8]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8C0D8]/80" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your secure password"
                      className={`h-12 rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] pl-10 pr-11 text-[15px] font-medium text-white placeholder:text-[#A8C0D8]/60 transition-all duration-300 focus:border-[#00D4FF]/70 focus:ring-2 focus:ring-[#00D4FF]/30 ${
                        errors.password ? 'login-shake border-red-400/70' : ''
                      }`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                      {...register('password')}
                    />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8C0D8]/80 transition hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-200">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-xs text-[#A8C0D8] transition hover:text-white"
                  onClick={() => setShowOtpField((prev) => !prev)}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {showOtpField ? 'Hide OTP verification' : 'Use OTP verification'}
                </button>
                {showOtpField && (
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8C0D8]/80" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="One-time passcode"
                      className="h-12 rounded-xl border border-white/15 bg-[rgba(255,255,255,0.08)] pl-10 text-[15px] font-medium text-white placeholder:text-[#A8C0D8]/60 transition-all duration-300 focus:border-[#00D4FF]/70 focus:ring-2 focus:ring-[#00D4FF]/30"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(event) => setRememberDevice(event.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-[#00C896] focus:ring-[#00D4FF]/40"
                  />
                  <span className="text-xs text-[#A8C0D8]">Remember this device</span>
                </label>
                <button type="button" className="text-xs text-[#A8C0D8] transition hover:text-white">
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                onMouseDown={handleButtonRipple}
                className="relative h-12 w-full overflow-hidden rounded-xl border-0 text-[15px] font-medium tracking-[0.5px] text-[#072437] shadow-[0_12px_24px_rgba(0,212,255,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(0,212,255,0.34)]"
                style={{
                  background: 'linear-gradient(90deg, #00C896 0%, #00D4FF 100%)',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                disabled={isSubmitting}
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="login-ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  />
                ))}
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Sign In Securely'
                )}
              </Button>

              <p className="pt-1 text-center text-xs text-[#A8C0D8]">
                Secure session active with encrypted institutional transport.
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
