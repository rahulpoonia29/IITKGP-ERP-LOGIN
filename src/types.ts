export type SecurityQuestions = {
    [key: string]: string;
};

export type getOTPCallback = () => Promise<string>;
