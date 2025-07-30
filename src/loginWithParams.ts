import { SessionCore } from "./core";

/**
 * Programmatic login to IIT KGP ERP using credentials and security answers map.
 * @param rollNo Roll number
 * @param password Password
 * @param securityAnswers Object mapping security questions to answers
 * @param getOTP Callback to get OTP (receives otpRequestedAt)
 * @returns Promise resolving to login result
 */
export async function loginWithCredentials(
    rollNo: string,
    password: string,
    securityAnswers: { [question: string]: string },
    getOTP: (otpRequestedAt: string) => Promise<string>
): Promise<string> {
    const session = new SessionCore();
    return session.login({
        rollNo,
        password,
        getSecurityAnswer: async (question) => {
            if (securityAnswers[question] !== undefined) {
                return securityAnswers[question];
            }
            throw new Error(
                `No answer found for security question: ${question}`
            );
        },
        getOTP,
    });
}
