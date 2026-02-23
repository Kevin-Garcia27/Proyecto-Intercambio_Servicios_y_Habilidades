const nodemailer = require('nodemailer');

// Configuración del transporte de correo (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Tu correo de Gmail
        pass: process.env.EMAIL_PASSWORD // Contraseña de aplicación de Gmail
    }
});

// Función para enviar correo de recuperación de contraseña
const enviarCorreoRecuperacion = async (destinatario, token) => {
    // Auto-detectar entorno: si NODE_ENV no es production, usar localhost
    const isLocal = process.env.NODE_ENV !== 'production';
    const frontendUrl = isLocal ? 'http://localhost:5050' : (process.env.FRONTEND_URL || 'https://SEMACKRO.duckdns.org');
    const enlaceRecuperacion = `${frontendUrl}/restablecer-password.html?token=${token}`;
    
    const mailOptions = {
        from: `"SEMACKRO" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: 'Recuperación de Contraseña - SEMACKRO',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 10px;
                        padding: 30px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        color: #4f46e5;
                        margin-bottom: 30px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #4f46e5;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #4338ca;
                    }
                    .warning {
                        background-color: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SEMACKRO</h1>
                        <h2>Recuperación de Contraseña</h2>
                    </div>
                    
                    <p>Hola,</p>
                    
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SEMACKRO.</p>
                    
                    <p>Si realizaste esta solicitud, haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    
                    <div style="text-align: center;">
                        <a href="${enlaceRecuperacion}" style="display: inline-block; padding: 15px 40px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
                    </div>
                    
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all; color: #4f46e5;">${enlaceRecuperacion}</p>
                    
                    <div class="warning">
                        <strong>Importante:</strong> Este enlace expirará en <strong>15 minutos</strong> por razones de seguridad.
                    </div>
                    
                    <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
                    
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; 2025 SEMACKRO. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { enviarCorreoRecuperacion };
