"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { pin, isAuthenticated, setPin, authenticate } = useStore();
  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  // First time setup - no PIN set yet
  if (!pin) {
    const handleSetPin = () => {
      if (inputPin.length !== 4 || !/^\d{4}$/.test(inputPin)) {
        setError("PIN must be exactly 4 digits");
        return;
      }
      setPin(inputPin);
      setError("");
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass w-full max-w-md p-8 rounded-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-50">Welcome to NeuroStack</h1>
            <p className="text-slate-400">Set up your 4-digit security PIN</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSetPin();
              }}
              className="text-center text-2xl tracking-widest h-14"
            />
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button
              onClick={handleSetPin}
              className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600"
            >
              <Check className="w-5 h-5 mr-2" />
              Set PIN & Continue
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            This PIN is stored locally in your browser. Don&apos;t forget it!
          </p>
        </div>
      </div>
    );
  }

  // PIN is set but not authenticated
  if (!isAuthenticated) {
    const handleLogin = () => {
      if (authenticate(inputPin)) {
        setInputPin("");
        setError("");
      } else {
        setError("Incorrect PIN");
        setInputPin("");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass w-full max-w-md p-8 rounded-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-50">NeuroStack</h1>
            <p className="text-slate-400">Enter your PIN to continue</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter PIN"
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              className="text-center text-2xl tracking-widest h-14"
              autoFocus
            />
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600"
            >
              <Lock className="w-5 h-5 mr-2" />
              Unlock
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show the app
  return <>{children}</>;
}
