<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP e-Bawaslu</title>
</head>
<body style="margin: 0; background-color: #f3f6f9; color: #17202a; font-family: Arial, Helvetica, sans-serif;">
    <div style="padding: 32px 16px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dfe6ec; border-radius: 12px; overflow: hidden;">
            <div style="padding: 28px 32px; background-color: #0f5132; color: #ffffff;">
                <div style="font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.85;">e-Bawaslu</div>
                <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.3;">Verifikasi Login</h1>
            </div>

            <div style="padding: 32px;">
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Halo,</p>
                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6;">Gunakan kode berikut untuk menyelesaikan proses login Anda:</p>

                <div style="margin: 0 0 24px; padding: 20px; background-color: #edf7f1; border: 1px solid #c7e6d2; border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; letter-spacing: 1.5px; color: #47705a; text-transform: uppercase;">Kode OTP</div>
                    <div style="margin-top: 8px; color: #0f5132; font-size: 36px; font-weight: 700; letter-spacing: 8px;">{{ $otpCode }}</div>
                </div>

                <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px; line-height: 1.6;">Kode ini berlaku selama <strong>{{ $expiryMinutes }} menit</strong>.</p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Jangan bagikan kode ini kepada siapa pun. Jika Anda tidak merasa melakukan login, abaikan email ini.</p>
            </div>

            <div style="padding: 20px 32px; border-top: 1px solid #edf0f2; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Email ini dikirim otomatis oleh Sistem e-Bawaslu. Mohon tidak membalas email ini.
            </div>
        </div>
    </div>
</body>
</html>