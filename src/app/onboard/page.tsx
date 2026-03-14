import { redirect } from 'next/navigation'

// /onboard → /auth/onboard (canonical onboard route)
export default function OnboardRedirect() {
  redirect('/auth/onboard')
}
