import { redirect } from 'next/navigation'

// /login → /auth/login (canonical login route)
export default function LoginRedirect() {
  redirect('/auth/login')
}
