# IIT KGP ERP Login Package

Easily log in to IIT Kharagpur ERP from Node.js, with both CLI and programmatic APIs. Handles OTP, security questions, and session management.

## Installation

```sh
npm install iitkgp-erp-login
```

## API

### Programmatic Login

```ts
import { loginWithCredentials } from "iitkgp-erp-login";

const result = await loginWithCredentials(
    "23XX12345", // roll number
    "password123", // password
    {
        "What is your pet's name?": "Sheru",
        "Your favourite teacher?": "Mr. Sharma",
        "Your birth city?": "Mumbai",
    }, // security answers
    async (otpRequestedAt) => {
        // Prompt user or fetch OTP from email
        return "123456";
    }
);
console.log(result.ssoToken); // Use this for authenticated requests
```

**Returns:**

-   `ssoToken`: The SSO token for authenticated ERP access
-   `sessionToken`: The ERP session token
-   `cookieJar`: The CookieJar instance with all session cookies

### CLI Login

```ts
import { loginWithCLI } from "iitkgp-erp-login";

await loginWithCLI();
// Prompts for roll number, password, security answer, and OTP in the terminal
```

## Error Handling

All functions throw errors with clear messages if login fails or required information is missing.

## Advanced Usage

You can use the returned `cookieJar` and `sessionToken` for further ERP requests if needed.
