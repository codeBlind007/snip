"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { Link2 } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, openAuthModal } = useAuth();

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent onClose={closeAuthModal} className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 mb-2">
            <Link2 className="h-5 w-5 text-zinc-100" />
          </div>
          <DialogTitle>Account Access</DialogTitle>
          <DialogDescription>
            Sign in or register to customize links, configure expiration, and access click analytics.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={authModalTab} onValueChange={(val) => openAuthModal(val as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onSuccess={closeAuthModal} />
          </TabsContent>

          <TabsContent value="signup">
            <SignupForm onSuccess={closeAuthModal} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

