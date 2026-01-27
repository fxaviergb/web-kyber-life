"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/presentation/components/auth/logout-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/domain/entities";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function ProfileForm({ user }: { user: User }) {
    const [profileState, profileAction, isProfilePending] = useActionState(updateProfileAction, null);
    const [passwordState, passwordAction, isPasswordPending] = useActionState(changePasswordAction, null);

    return (
        <>
            <Card className="bg-bg-1 border-border">
                <CardHeader>
                    <CardTitle className="text-xl text-text-1">Preferencias</CardTitle>
                    <CardDescription>Configura tu experiencia</CardDescription>
                </CardHeader>
                <form action={profileAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda Principal</Label>
                            <Select name="defaultCurrencyCode" defaultValue={user.defaultCurrencyCode}>
                                <SelectTrigger className="bg-bg-2 border-input">
                                    <SelectValue placeholder="Selecciona moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {profileState?.success && (
                            <p className="text-sm text-accent-mint">{profileState.message}</p>
                        )}
                        {profileState?.error && (
                            <p className="text-sm text-destructive">{profileState.error}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="bg-accent-violet hover:bg-accent-violet/90 text-white"
                            disabled={isProfilePending}
                        >
                            {isProfilePending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Preferencias"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="bg-bg-1 border-border">
                <CardHeader>
                    <CardTitle className="text-xl text-text-1">Seguridad</CardTitle>
                    <CardDescription>Actualiza tu contraseña</CardDescription>
                </CardHeader>
                <form action={passwordAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Contraseña Actual</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                required
                                className="bg-bg-2 border-input focus:border-accent-violet"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva Contraseña</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                minLength={8}
                                className="bg-bg-2 border-input focus:border-accent-violet"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                            <Input
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                type="password"
                                required
                                className="bg-bg-2 border-input focus:border-accent-violet"
                            />
                        </div>
                        {passwordState?.success && (
                            <p className="text-sm text-accent-mint">{passwordState.message}</p>
                        )}
                        {passwordState?.error && (
                            <p className="text-sm text-destructive">{passwordState.error}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="bg-bg-2 border border-border hover:bg-bg-3 text-text-1"
                            disabled={isPasswordPending}
                        >
                            {isPasswordPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cambiar Contraseña"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="bg-destructive/10 border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-xl text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>Acciones de sesión</CardDescription>
                </CardHeader>
                <CardContent>
                    <LogoutButton variant="destructive" />
                </CardContent>
            </Card>
        </>
    );
}
