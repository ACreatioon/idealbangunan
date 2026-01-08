'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "@inertiajs/react"
import { FormEvent } from "react"

export default function Login() {

  interface LoginForm {
    email: string
    password: string
    remember: boolean
  }

  const { data, setData, errors, post, processing } = useForm<LoginForm>({
    email: "",
    password: "",
    remember: false
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    post('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <img src="/logo/IDEAL-LOGO_RETRACE.png" alt="" />
          <h1 className="text-3xl font-bold tracking-tight">
            Login
          </h1>
          <p className="text-sm text-black/60 mt-2">
            Silakan masuk ke akun Anda
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              placeholder="email@example.com"
              className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-black">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              placeholder="••••••••"
              className=" bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={(e) =>
                setData("remember", e.target.checked)
              }
            />
            Remember me
          </label>

          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}

          <Button
            type="submit"
            disabled={processing}
            className="
              w-full
              bg-orange-500
              hover:bg-orange-600
              text-white
              font-semibold
            "
          >
            {processing ? 'Loading' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-black/50">
          © 2025 • Sipena Login
        </p>
      </div>
    </div>
  )
}
