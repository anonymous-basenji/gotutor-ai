/**
 * Calculate someone's age from their birth date.
 * Accounts for whether their birthday has occurred yet this year.
 *
 * Previously this function was copy-pasted in both auth.ts and classes.ts.
 * Now it lives here, used by any service that needs it.
 */
export const calculateAge = (birthDate: Date): number => {
    const currentDate = new Date();

    // Start with the raw year difference
    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if their birthday hasn't happened yet this year
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};
