export const resetPasswordEmail = (link: string) => `
  <div style="font-family:Arial,sans-serif">
    <h2>Reset hesla</h2>
    <p>Klikni na odkaz (platí 30 minút):</p>
    <p><a href="${link}">${link}</a></p>
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
