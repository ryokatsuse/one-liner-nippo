'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Form } from './ui/Form';
import { TextField } from './ui/TextField';
import { Button } from './ui/Button';

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!username) newErrors.username = 'ユーザー名は必須です';
    if (!password) newErrors.password = 'パスワードは必須です';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('http://localhost:62347/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          router.push('/signup/complete');
        } else {
          const errorData = await response.json();
          setErrors({ general: errorData.error || '登録に失敗しました' });
        }
      } catch (error) {
        setErrors({ general: 'ネットワークエラーが発生しました' });
      }
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="space-y-4">
        <TextField
          name="username"
          label="ユーザー名"
          placeholder="ユーザー名を入力"
          error={errors.username}
          isRequired
        />

        <TextField
          name="password"
          label="パスワード"
          type="password"
          placeholder="パスワードを入力"
          error={errors.password}
          isRequired
        />
      </div>

      {errors.general && (
        <div className="text-red-600 text-sm text-center">{errors.general}</div>
      )}

      <Button type="submit" isDisabled={isPending} fullWidth>
        {isPending ? '登録中...' : 'アカウント登録'}
      </Button>
    </Form>
  );
}