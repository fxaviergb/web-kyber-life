"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/domain/entities";
import { Facebook, Twitter, Linkedin, Instagram, Pen, Loader2, MapPin, User as UserIcon, Mail, Phone, Globe } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";
import { cn } from "@/lib/utils";

export function ProfileForm({ user }: { user: User }) {
    // Only useActionState for the inline preferences form if needed, or put it in a dialog too?
    // Design has preferences inline? Or just display?
    // User requested "Allow editing all info".
    // I will put Preferences in a Dialog too or keep inline. Inline is fine for quick switches.
    const [profileState, profileAction] = useActionState(updateProfileAction, null);
    const [passwordState, passwordAction] = useActionState(changePasswordAction, null);

    // For password, we keep the dialog pattern I built before? Or the new EditProfileDialog?
    // The new EditProfileDialog wraps a form. changePasswordAction takes (state, formData).
    // So distinct from profileAction but same signature.
    // I can use EditProfileDialog for Password too!

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4 md:px-6">

            {/* Header / Intro Card */}
            <Card className="border-border-base shadow-sm bg-gradient-to-r from-bg-secondary/40 to-bg-tertiary/20 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-bg-primary shadow-xl overflow-hidden bg-bg-tertiary shrink-0 relative Group">
                        {user.image ? (
                            <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-accent-primary/10 text-accent-primary text-3xl font-bold">
                                {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                                {user.firstName} {user.lastName}
                                {!user.firstName && <span className="text-text-secondary">{user.email.split('@')[0]}</span>}
                            </h1>
                            <p className="text-text-tertiary font-medium text-lg">
                                {user.bio || "Agrega una biografía..."}
                            </p>
                            {(user.city || user.country) && (
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-sm text-text-tertiary">
                                    <MapPin className="w-4 h-4" />
                                    <span>{user.city}{user.city && user.country ? ", " : ""}{user.country}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                            {user.socials?.facebook && <a href={user.socials.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-secondary hover:text-[#1877F2] hover:bg-white transition-all hover:scale-110 shadow-sm"><Facebook size={18} /></a>}
                            {user.socials?.twitter && <a href={user.socials.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-secondary hover:text-[#1DA1F2] hover:bg-white transition-all hover:scale-110 shadow-sm"><Twitter size={18} /></a>}
                            {user.socials?.linkedin && <a href={user.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-secondary hover:text-[#0A66C2] hover:bg-white transition-all hover:scale-110 shadow-sm"><Linkedin size={18} /></a>}
                            {user.socials?.instagram && <a href={user.socials.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-bg-tertiary text-text-secondary hover:text-[#E4405F] hover:bg-white transition-all hover:scale-110 shadow-sm"><Instagram size={18} /></a>}
                        </div>
                    </div>

                    <div className="shrink-0 self-start md:self-center">
                        <EditProfileDialog
                            title="Editar Perfil"
                            action={updateProfileAction}
                            trigger={<Button variant="outline" className="gap-2 rounded-full px-5 shadow-sm hover:shadow transition-all bg-bg-primary/50"> <Pen size={14} /> Editar </Button>}
                        >
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Foto de Perfil (URL)</Label>
                                    <Input name="image" defaultValue={user.image || ""} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Biografía / Título</Label>
                                    <Input name="bio" defaultValue={user.bio || ""} placeholder="Ej. Gerente de Ventas" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Facebook</Label><Input name="facebook" defaultValue={user.socials?.facebook || ""} placeholder="https://facebook.com/..." /></div>
                                    <div className="space-y-2"><Label>X (Twitter)</Label><Input name="twitter" defaultValue={user.socials?.twitter || ""} placeholder="https://x.com/..." /></div>
                                    <div className="space-y-2"><Label>LinkedIn</Label><Input name="linkedin" defaultValue={user.socials?.linkedin || ""} placeholder="https://linkedin.com/..." /></div>
                                    <div className="space-y-2"><Label>Instagram</Label><Input name="instagram" defaultValue={user.socials?.instagram || ""} placeholder="https://instagram.com/..." /></div>
                                </div>
                            </div>
                        </EditProfileDialog>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {/* Col 1: Personal Info */}
                <Card className="border-border-base shadow-sm h-full hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border-base/50 pb-4 bg-bg-secondary/10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-accent-primary/10 text-accent-primary">
                                <UserIcon size={18} />
                            </div>
                            <CardTitle className="text-lg">Personal</CardTitle>
                        </div>
                        <EditProfileDialog
                            title="Editar Información Personal"
                            action={updateProfileAction}
                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-full"> <Pen size={14} /> </Button>}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nombre</Label><Input name="firstName" defaultValue={user.firstName || ""} /></div>
                                <div className="space-y-2"><Label>Apellido</Label><Input name="lastName" defaultValue={user.lastName || ""} /></div>
                                <div className="space-y-2 col-span-2"><Label>Email</Label><Input disabled value={user.email} className="bg-bg-tertiary" /></div>
                                <div className="space-y-2"><Label>Teléfono</Label><Input name="phone" defaultValue={user.phone || ""} /></div>
                            </div>
                        </EditProfileDialog>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Nombre Completo</span>
                            <div className="font-medium text-text-primary text-base">{user.firstName} {user.lastName}</div>
                            {(!user.firstName && !user.lastName) && <div className="italic text-text-tertiary">-</div>}
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Email</span>
                            <div className="font-medium text-text-primary break-all flex items-center gap-2">
                                <Mail size={14} className="text-text-tertiary" />
                                {user.email}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Teléfono</span>
                            <div className="font-medium text-text-primary flex items-center gap-2">
                                <Phone size={14} className="text-text-tertiary" />
                                {user.phone || <span className="italic text-text-tertiary">No registrado</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Col 2: Address */}
                <Card className="border-border-base shadow-sm h-full hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border-base/50 pb-4 bg-bg-secondary/10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-accent-warning/10 text-accent-warning">
                                <MapPin size={18} />
                            </div>
                            <CardTitle className="text-lg">Ubicación</CardTitle>
                        </div>
                        <EditProfileDialog
                            title="Editar Ubicación"
                            action={updateProfileAction}
                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-full"> <Pen size={14} /> </Button>}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>País</Label><Input name="country" defaultValue={user.country || ""} /></div>
                                <div className="space-y-2"><Label>Provincia / Estado</Label><Input name="province" defaultValue={user.province || ""} /></div>
                                <div className="space-y-2"><Label>Ciudad</Label><Input name="city" defaultValue={user.city || ""} /></div>
                                <div className="space-y-2"><Label>Parroquia</Label><Input name="parish" defaultValue={user.parish || ""} /></div>
                                <div className="space-y-2"><Label>Barrio</Label><Input name="neighborhood" defaultValue={user.neighborhood || ""} /></div>
                                <div className="space-y-2"><Label>Código Postal</Label><Input name="postalCode" defaultValue={user.postalCode || ""} /></div>
                                <div className="space-y-2 col-span-2"><Label>Calle Primaria</Label><Input name="primaryStreet" defaultValue={user.primaryStreet || ""} /></div>
                                <div className="space-y-2 col-span-2"><Label>Calle Secundaria</Label><Input name="secondaryStreet" defaultValue={user.secondaryStreet || ""} /></div>
                                <div className="space-y-2 col-span-2"><Label>Referencia</Label><Input name="addressReference" defaultValue={user.addressReference || ""} /></div>
                            </div>
                        </EditProfileDialog>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Ubicación General</span>
                                <div className="font-medium text-text-primary text-sm">
                                    {[user.neighborhood, user.parish, user.city, user.province, user.country].filter(Boolean).join(", ")}
                                    {(!user.city && !user.country) && <span className="text-text-tertiary italic">-</span>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Calles</span>
                                <div className="font-medium text-text-primary text-sm space-y-0.5">
                                    {user.primaryStreet && <div><span className="text-text-tertiary">Pri:</span> {user.primaryStreet}</div>}
                                    {user.secondaryStreet && <div><span className="text-text-tertiary">Sec:</span> {user.secondaryStreet}</div>}
                                    {!user.primaryStreet && !user.secondaryStreet && <span className="text-text-tertiary italic">-</span>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Referencia</span>
                                <div className="font-medium text-text-primary text-sm italic text-text-secondary">
                                    {user.addressReference ? `"${user.addressReference}"` : "-"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Col 3: Preferences & Security */}
                <div className="space-y-6 flex flex-col h-full">
                    {/* Preferences */}
                    <Card className="border-border-base shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Preferencias</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form action={profileAction} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Moneda Por Defecto</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select name="defaultCurrencyCode" defaultValue={user.defaultCurrencyCode}>
                                                <SelectTrigger className="bg-bg-tertiary/50"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                                                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                                    <SelectItem value="ARS">ARS (Peso)</SelectItem>
                                                    <SelectItem value="MXN">MXN (Peso)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" size="icon" className="shrink-0 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-colors"><Pen size={16} /></Button>
                                    </div>
                                </div>
                            </form>
                            {profileState?.success && (
                                <div className="flex items-center gap-2 text-xs text-accent-success font-medium mt-3 animate-in fade-in slide-in-from-top-1">
                                    <span className="font-bold">✓</span> Guardado
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card className="border-border-base shadow-sm hover:shadow-md transition-shadow duration-300 flex-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-accent-warning/5 border border-accent-warning/10 text-sm text-text-secondary">
                                <p>Mantén tu cuenta segura actualizando tu contraseña regularmente.</p>
                            </div>
                            <EditProfileDialog
                                title="Cambiar Contraseña"
                                action={changePasswordAction}
                                trigger={<Button variant="outline" className="w-full bg-bg-secondary/50 hover:bg-bg-secondary hover:text-accent-primary border-border-base transition-colors">Actualizar Contraseña</Button>}
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Contraseña Actual</Label><Input name="currentPassword" type="password" required /></div>
                                    <div className="space-y-2"><Label>Nueva Contraseña</Label><Input name="newPassword" type="password" required /></div>
                                    <div className="space-y-2"><Label>Confirmar</Label><Input name="confirmNewPassword" type="password" required /></div>
                                </div>
                            </EditProfileDialog>
                            {passwordState?.success && <p className="text-accent-success text-xs mt-2">{passwordState.message}</p>}
                            {passwordState?.error && <p className="text-accent-danger text-xs mt-2">{passwordState.error}</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
