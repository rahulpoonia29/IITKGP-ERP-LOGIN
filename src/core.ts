import ky from "ky";
import { CookieJar } from "tough-cookie";
import { ENDPOINTS } from "./endpoints";
import { ERPResponseMessages } from "./erpResponses";

export class SessionCore {
    private client: typeof ky;
    private cookieJar: CookieJar;

    constructor() {
        this.cookieJar = new CookieJar();
        this.client = ky.extend({
            hooks: {
                beforeRequest: [
                    async (request) => {
                        const url = request.url;
                        const cookies = await this.cookieJar.getCookies(url);
                        const cookieString = cookies.join("; ");
                        request.headers.set("cookie", cookieString);
                    },
                ],
                afterResponse: [
                    async (request, options, response) => {
                        const url = request.url;
                        const cookies = response.headers.getSetCookie();
                        if (cookies) {
                            for (const cookie of cookies) {
                                await this.cookieJar.setCookie(cookie, url);
                            }
                        }
                    },
                ],
            },
        });
    }

    public async login(params: {
        rollNo: string;
        password: string;
        getSecurityAnswer: (question: string) => Promise<string>;
        getOTP: (otpRequestedAt: string) => Promise<string>;
    }): Promise<string> {
        try {
            const sessionToken = await this.getSessionToken();

            const securityQuestion = await this.getSecurityQuestion(
                params.rollNo
            );
            const securityAnswer = await params.getSecurityAnswer(
                securityQuestion
            );

            await this.requestOTP({
                rollNo: params.rollNo,
                password: params.password,
                securityAnswer,
                sessionToken,
            });
            const otpRequestedAt = new Date().toISOString();
            const OTP = await params.getOTP(otpRequestedAt);

            const ssoToken = await this.signIn({
                rollNo: params.rollNo,
                password: params.password,
                securityAnswer,
                otp: OTP,
                sessionToken,
            });
            return ssoToken;
        } catch (error) {
            throw new Error(`Login failed: ${(error as Error).message}`);
        }
    }

    private async getSessionToken(): Promise<string> {
        const response = await this.client.get(ENDPOINTS.HOMEPAGE_URL);
        const url = new URL(response.url);
        const sessionToken = url.searchParams.get("sessionToken");
        if (!sessionToken) {
            throw new Error("Session token not found in response URL");
        }
        return sessionToken;
    }

    private async getSecurityQuestion(userID: string): Promise<string> {
        return await this.client
            .post(ENDPOINTS.SECURITY_QUESTION_URL, {
                body: `user_id=${userID}`,
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                    Accept: "text/plain, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                },
            })
            .text();
    }

    private async requestOTP(params: {
        rollNo: string;
        password: string;
        securityAnswer: string;
        sessionToken: string;
    }): Promise<void> {
        const requestBody = new URLSearchParams({
            user_id: params.rollNo,
            password: params.password,
            answer: params.securityAnswer,
            typeee: "SI",
            email_otp: "",
            sessionToken: params.sessionToken,
            requestedUrl: "https://erp.iitkgp.ac.in/IIT_ERP3/",
        });

        const response = await this.client
            .post<{ msg: string }>(ENDPOINTS.OTP_URL, {
                body: requestBody.toString(),
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                    Accept: "text/plain, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                },
            })
            .json();

        switch (response.msg) {
            case ERPResponseMessages.USER_ID_ERROR:
            case ERPResponseMessages.PASSWORD_MISMATCH_ERROR:
            case ERPResponseMessages.ANSWER_MISMATCH_ERROR:
                throw new Error("OTP request failed: " + response.msg);
            case ERPResponseMessages.OTP_SENT_MESSAGE:
                break;
            default:
                throw new Error(
                    "OTP request failed: Unexpected response: " + response.msg
                );
        }
    }

    private async signIn(params: {
        rollNo: string;
        password: string;
        securityAnswer: string;
        otp: string;
        sessionToken: string;
    }): Promise<string> {
        const requestBody = new URLSearchParams({
            user_id: params.rollNo,
            password: params.password,
            answer: params.securityAnswer,
            typeee: "SI",
            email_otp: params.otp,
            sessionToken: params.sessionToken,
            requestedUrl: "https://erp.iitkgp.ac.in/IIT_ERP3/",
        });

        const response = await this.client
            .post(ENDPOINTS.LOGIN_URL, {
                body: requestBody.toString(),
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                    Accept: "text/plain, */*; q=0.01",
                },
            })
            .text();

        if (response.includes(ERPResponseMessages.OTP_MISMATCH_ERROR)) {
            throw new Error("Login failed: OTP mismatch");
        }

        const ssoTokenRegex = /ssoToken=([a-zA-Z0-9.]+)/;
        const ssoTokenMatch = response.match(ssoTokenRegex);
        if (!ssoTokenMatch || !ssoTokenMatch[1]) {
            throw new Error(
                "Login failed: ssoToken not found in the HTML response."
            );
        }
        return ssoTokenMatch[1];
    }
}
