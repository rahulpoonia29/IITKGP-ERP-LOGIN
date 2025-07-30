import { CookieJar } from "tough-cookie";
import { SessionCore } from "./core";

/**
 * Programmatic login to IIT KGP ERP using credentials and security answers map.
 *
 * @param rollNo - The user's ERP roll number.
 * @param password - The user's ERP password.
 * @param securityAnswers - An object mapping all 3 security questions (as shown by ERP) to their answers.
 *   Example: `{
 *     "What is your pet's name?": "Sheru",
 *     "Your favourite teacher?": "Mr. Sharma",
 *     "Your birth city?": "Mumbai"
 *   }`
 *   ERP will randomly ask one of these at login.
 * @param getOTP - A callback that will be called with the ISO timestamp (string) when the OTP was requested.
 *
 * @returns Promise resolving to an object containing:
 *   - `ssoToken`: The SSO token string for authenticated ERP access.
 *   - `sessionToken`: The session token string for the ERP session.
 *   - `cookieJar`: The CookieJar instance containing all cookies for the session.
 *
 * @example
 * ```typescript
 * import { loginWithCredentials } from "iitkgp-erp-login";
 *
 * const result = await loginWithCredentials(
 *   "23XX12345",
 *   "password123",
 *   {
 *     "What is your pet's name?": "Sheru",
 *     "Your favourite teacher?": "Mr. Sharma",
 *     "Your birth city?": "Mumbai"
 *   },
 *   async (otpRequestedAt) => {
 *     // Prompt user or fetch OTP from email
 *     return "123456";
 *   }
 * );
 * console.log(result.ssoToken);
 * ```
 */
export async function loginWithCredentials(
    rollNo: string,
    password: string,
    securityAnswers: { [question: string]: string },
    getOTP: (otpRequestedAt: string) => Promise<string>
): Promise<{ ssoToken: string; sessionToken: string; cookieJar: CookieJar }> {
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
