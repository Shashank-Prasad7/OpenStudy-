import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  timezone: z.string().default('UTC'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post('/api/auth/register', data)
      setUser(res.data.user)
      toast.success('Account created! Welcome to OpenStudy 🎉')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <GraduationCap className="h-16 w-16 text-white mb-6" />
        <h1 className="text-4xl font-bold text-white mb-3">Join OpenStudy</h1>
        <p className="text-white/80 text-lg text-center max-w-sm">
          Real-time study rooms. Synced Pomodoro. Smart accountability partners.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">OpenStudy</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Create account</h2>
          <p className="text-muted-foreground text-sm mb-8">Start studying smarter today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Alex Johnson" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="••••••••" {...register('password')} className="pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full gradient-brand border-0 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
