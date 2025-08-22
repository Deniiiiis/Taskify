export const resetPasswordCodeEmail = (code: string) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
    <h2>Reset hesla</h2>
    <p>Na reset hesla zadaj tento kód (platí 15 minút):</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:3px;margin:16px 0">${code}</p>
    <p>Ak si o reset nežiadal, ignoruj tento e-mail.</p>
  </div>
`;
export const otpLoginEmail = (code: string) => `
  <div style="font-family:Arial,sans-serif">
    <h2>Váš prihlasovací kód</h2>
    <p>Tu je váš 6-ciferný kód (platí 10 minút):</p>
    <p style="font-size:24px;letter-spacing:4px;"><b>${code}</b></p>
    <p>Ak ste o kód nežiadali, ignorujte tento e-mail.</p>
  </div>
`;
export const verifyEmailEmail = (code: string) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
    <h2>Overenie e-mailu</h2>
    <p>Tvoj overovací kód:</p>
    <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
    <p>Kód platí 15 minút.</p>
  </div>
`;
