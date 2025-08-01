export enum ERPResponseMessages {
    USER_ID_ERROR = "Incorrect User Id or Access Expired",
    PASSWORD_MISMATCH_ERROR = "Unable to send OTP due to password mismatch.",
    ANSWER_MISMATCH_ERROR = "Unable to send OTP due to security question's answare mismatch .",
    OTP_SENT_MESSAGE = "An OTP(valid for a short time) has been sent to your email id registered with ERP, IIT Kharagpur. Please use that OTP for further processing. ",
    OTP_MISMATCH_ERROR = "ERROR:Email OTP mismatch",
}
