export const resetCodeHtml = ({ name, code }) => {
    return `<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #333;
            margin: 0;
            padding: 0;
            color: #fff;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 50px auto;
            background-color: #444;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 {
            color: #fff;
            font-size: 28px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
            color: #ddd;
            margin-bottom: 30px;
        }
        .content p{
            color: #ddd;
        }
        .code-box {
            background-color: #f4b400;
            color: #333;
            font-size: 26px;
            font-weight: bold;
            padding: 15px 25px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            font-size: 14px;
            color: #bbb;
            text-align: center;
        }
        .footer a {
            color: #f4b400;
            text-decoration: none;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer .note {
            font-size: 16px;
            font-style: italic;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>!${name} مرحبًا </h2>
        </div>
        <div class="content">
            <p>تم طلب رمز التحقق لحسابك في <strong>Saraha</strong>.</p>
            <p>لاستكمال عملية التحقق، يرجى إدخال الرمز التالي:</p>
            <div class="code-box">${code}</div>
            <p>يرجى ملاحظة أن هذا الرمز صالح لمدة 10 دقائق فقط.</p>
        </div>
        <div class="footer">
            <p class="note">إذا لم تكن قد طلبت هذا الرمز، يمكنك تجاهل هذه الرسالة.</p>
            <p>شكرًا لك،</p>
            <p><strong>Saraha</strong></p>
            <p>إذا كنت بحاجة إلى مساعدة، يمكنك <a href="mailto:support@yourwebsite.com">التواصل مع الدعم الفني</a>.</p>
        </div>
    </div>
</body>
</html>`
}