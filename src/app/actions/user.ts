"use server";

import { userService, authService, initializeContainer } from "@/infrastructure/container";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validators/user-schemas";

initializeContainer();

export async function updateProfileAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Construct socials object if fields exist in flat format (from Edit Profile Form)
    const constructedSocials: Record<string, any> = {};
    if (rawData.facebook) constructedSocials.facebook = rawData.facebook;
    if (rawData.twitter) constructedSocials.twitter = rawData.twitter;
    if (rawData.linkedin) constructedSocials.linkedin = rawData.linkedin;
    if (rawData.instagram) constructedSocials.instagram = rawData.instagram;

    if (Object.keys(constructedSocials).length > 0) {
        // @ts-ignore
        rawData.socials = constructedSocials;
    }

    const result = updateProfileSchema.safeParse(rawData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const {
        defaultCurrencyCode,
        image,
        firstName,
        lastName,
        phone,
        bio,
        country,
        province,
        city,
        parish,
        neighborhood,
        primaryStreet,
        secondaryStreet,
        addressReference,
        postalCode,
        socials
    } = result.data;
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) return { error: "Unauthorized" };

    try {
        await userService.updateProfile({
            userId,
            defaultCurrencyCode,
            image,
            firstName,
            lastName,
            phone,
            bio,
            country,
            province,
            city,
            parish,
            neighborhood,
            primaryStreet,
            secondaryStreet,
            addressReference,
            postalCode,
            socials
        });
        revalidatePath("/", "layout");
        return { success: true, message: "Perfil actualizado" };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const result = changePasswordSchema.safeParse(rawData);

    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { currentPassword, newPassword } = result.data;
    const cookieStore = await cookies();
    const userId = cookieStore.get("kyber_session")?.value;

    if (!userId) return { error: "Unauthorized" };

    try {
        await authService.changePassword({ userId, currentPassword, newPassword });
        return { success: true, message: "Contraseña actualizada" };
    } catch (error: any) {
        return { error: error.message };
    }
}
