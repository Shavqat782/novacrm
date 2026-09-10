import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { teamService } from '../lib/database';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle2, ArrowRight } from 'lucide-react';

interface InvitePageProps {
  inviteCode: string;
  onSuccess: (email: string, name: string) => void;
}

const InvitePage: React.FC<InvitePageProps> = ({ inviteCode, onSuccess }) => {
  const [step, setStep] = useState<'register' | 'success'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password || !name) {
        throw new Error('Заполните все поля');
      }

      if (password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
      }

      // Регистрация пользователя
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('Ошибка при создании пользователя');
      }

      // Сохраняем информацию в БД
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: name
        });

      if (insertError && insertError.code !== '23505') {
        // 23505 - unique constraint violation - это ок, значит пользователь уже существует
        throw insertError;
      }

      // Сохраняем код приглашения как использованный + добавляем в команду владельца
      try {
        const invite = await teamService.getInviteByCode(inviteCode);
        if (invite) {
          await teamService.useInvite(inviteCode, data.user.id);
          await teamService.addMemberToWorkspace(
            invite.workspace_id,
            data.user.id,
            invite.role || 'Менеджер'
          );
        }
      } catch (inviteErr) {
        // Приглашение устарело/не найдено — регистрация всё равно прошла
        console.warn('Invite processing failed:', inviteErr);
      }

      setStep('success');
      onSuccess(email, name);
    } catch (err: any) {
      setError(err.message || 'Ошибка при регистрации');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Добро пожаловать!</h1>
            <p className="text-slate-600">
              Ваш аккаунт успешно создан. Проверьте почту <span className="font-bold">{email}</span> для подтверждения.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-sm text-amber-800">
                📧 <strong>Важно!</strong> Подтвердите свой email по ссылке из письма, чтобы полностью активировать аккаунт.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-6"
            >
              Перейти на главную
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4 backdrop-blur">
            <div className="text-2xl font-bold text-white">NC</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NovaCRM</h1>
          <p className="text-indigo-100">Присоединитесь к команде</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Создать аккаунт</h2>
            <p className="text-sm text-slate-500 mt-2">
              Вы приглашены в NovaCRM. Заполните данные для регистрации.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Имя */}
            <div className="relative">
              <input
                type="text"
                placeholder="Ваше имя и фамилия"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-12 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader size={18} className="animate-spin" />}
              {loading ? 'Создание аккаунта...' : 'Присоединиться к команде'}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500">
              Создавая аккаунт, вы соглашаетесь с условиями использования
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-indigo-100 text-xs mt-8">
          Бесплатная версия. Бизнес-ОС для современного менеджера.
        </p>
      </div>
    </div>
  );
};

export default InvitePage;
