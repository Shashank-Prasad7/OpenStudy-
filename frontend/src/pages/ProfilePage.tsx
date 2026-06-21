import { useState, type FormEvent } from 'react'
import { Save, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { LoadingPanel } from '@/components/common/AsyncState'
import { PageHeader } from '@/components/common/PageHeader'
import { Textarea } from '@/components/common/FormControls'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMe, useUpdateMe } from '@/hooks/useUser'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'

function ProfileForm({ user, saving, onSave }: { user: User; saving: boolean; onSave: (data: Partial<Pick<User, 'name' | 'bio' | 'timezone' | 'avatar_url'>>) => Promise<void> }) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [timezone, setTimezone] = useState(user.timezone)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '')

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSave({ name: name.trim(), bio: bio.trim() || null, timezone, avatar_url: avatarUrl.trim() || null })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <Avatar className="h-28 w-28">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="gradient-brand text-3xl text-white">{getInitials(name || 'Open Study')}</AvatarFallback>
          </Avatar>
          <h2 className="mt-5 text-xl font-black">{name || 'Your profile'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary/10 p-3"><p className="text-2xl font-black text-primary">{user.streak_count}</p><p className="text-xs text-muted-foreground">day streak</p></div>
            <div className="rounded-2xl bg-secondary/60 p-3"><UserRound className="mx-auto h-6 w-6 text-primary" /><p className="mt-1 text-xs text-muted-foreground">member</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Display name</Label>
              <Input id="profile-name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-timezone">Timezone</Label>
              <Input id="profile-timezone" value={timezone} onChange={event => setTimezone(event.target.value)} required maxLength={50} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="avatar-url">Avatar URL</Label>
              <Input id="avatar-url" type="url" value={avatarUrl} onChange={event => setAvatarUrl(event.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea id="profile-bio" value={bio} onChange={event => setBio(event.target.value)} maxLength={1000} placeholder="What are you studying, and what kind of accountability helps you?" />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={saving || !name.trim()}><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  const me = useMe()
  const update = useUpdateMe()

  async function save(data: Partial<Pick<User, 'name' | 'bio' | 'timezone' | 'avatar_url'>>) {
    try {
      await update.mutateAsync(data)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update profile'))
    }
  }

  return (
    <div>
      <PageHeader title="Profile" description="Keep your public identity, timezone, and accountability context accurate for room members and partner matching." />
      {me.isLoading || !me.data ? <LoadingPanel label="Loading profile…" /> : <ProfileForm key={me.data.id} user={me.data} saving={update.isPending} onSave={save} />}
    </div>
  )
}
