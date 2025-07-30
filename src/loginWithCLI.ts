import { input } from "@inquirer/prompts";
import { SessionCore } from "./core";
import { CookieJar } from "tough-cookie";

/**
 * Login to IIT KGP ERP using CLI prompts for all details, with user feedback.
 */
export async function loginWithCLI(): Promise<{
    ssoToken: string;
    sessionToken: string;
    cookieJar: CookieJar;
}> {
    const session = new SessionCore();
    const rollNo = await input({ message: "Roll Number:", required: true });
    const password = await input({ message: "Password:", required: true });

    try {
        const loginResult = await session.login({
            rollNo,
            password,
            getSecurityAnswer: async (question) => {
                console.log(`Security Question: ${question}`);
                return await input({
                    message: "Security Answer:",
                    required: true,
                });
            },
            getOTP: async (otpRequestedAt) => {
                console.log(`OTP requested at: ${otpRequestedAt}`);
                return await input({ message: "Enter OTP:", required: true });
            },
        });
        console.log("Login successful!");
        return loginResult;
    } catch (err: any) {
        console.error("Login failed:", err.message);
        throw err;
    }
}
