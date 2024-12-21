import { useState } from 'react'
import { LoginForm } from '@/components/login-form'
import { RegisterForm } from '@/components/register-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'

import mascot from '../assets/budgee.png'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl flex flex-col items-center"
      >
        <motion.div
          className="relative mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.div
            className="flex items-center justify-center"
            initial={{ y: 0 }}
            animate={{ y: [0, -5, 0, 5, 0] }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <img src={mascot} alt="Authentication Mascot" className="max-w-[150px] max-h-[150px]" />
          </motion.div>
        </motion.div>

        <div className="w-full">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2 pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {isLogin
                  ? 'Great to see you again! Please enter your details.'
                  : 'Start your journey with us today.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {isLogin ? <LoginForm /> : <RegisterForm />}
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(!isLogin)}
                  className="mt-4 text-sm hover:text-gray-900 transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Register"
                    : 'Already have an account? Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}