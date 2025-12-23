-- Crear plantillas de correos automáticos por defecto
-- Solo si no existen ya

-- 1. PASSWORD_RESET
INSERT INTO automated_email_templates (gym_id, type, name, subject, content_body, available_variables, is_active)
SELECT 
  '68703e85-cfb2-441d-b00c-b4217b39416d',
  'PASSWORD_RESET',
  'Recuperación de Contraseña',
  'Recupera tu contraseña',
  E'Hola {userName},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n{resetLink}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, ignora este correo.',
  '{"userName": "Nombre del usuario", "resetLink": "Enlace de recuperación"}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM automated_email_templates 
  WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d' AND type = 'PASSWORD_RESET'
);

-- 2. PAYMENT_CONFIRMATION
INSERT INTO automated_email_templates (gym_id, type, name, subject, content_body, available_variables, is_active)
SELECT 
  '68703e85-cfb2-441d-b00c-b4217b39416d',
  'PAYMENT_CONFIRMATION',
  'Confirmación de Pago',
  'Confirmación de pago - {planName}',
  E'Hola {clientName},\n\n¡Gracias por tu pago!\n\nDetalles del pago:\n- Plan: {planName}\n- Monto: ${amount}\n- Fecha: {date}\n- Método: {paymentMethod}\n\nTu membresía ahora está activa. ¡Nos vemos en el gimnasio!',
  '{"clientName": "Nombre del cliente", "planName": "Nombre del plan", "amount": "Monto pagado", "date": "Fecha de pago", "paymentMethod": "Método de pago"}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM automated_email_templates 
  WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d' AND type = 'PAYMENT_CONFIRMATION'
);

-- 3. MEMBERSHIP_EXPIRATION
INSERT INTO automated_email_templates (gym_id, type, name, subject, content_body, available_variables, is_active)
SELECT 
  '68703e85-cfb2-441d-b00c-b4217b39416d',
  'MEMBERSHIP_EXPIRATION',
  'Aviso de Expiración',
  'Tu membresía vence pronto',
  E'Hola {clientName},\n\nTe recordamos que tu membresía del plan {planName} vencerá el {expirationDate}.\n\nNo pierdas tus beneficios. Renueva tu membresía antes de que expire.\n\nPara renovar, visítanos o contáctanos.',
  '{"clientName": "Nombre del cliente", "planName": "Nombre del plan", "expirationDate": "Fecha de expiración", "daysRemaining": "Días restantes"}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM automated_email_templates 
  WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d' AND type = 'MEMBERSHIP_EXPIRATION'
);

-- 4. WELCOME
INSERT INTO automated_email_templates (gym_id, type, name, subject, content_body, available_variables, is_active)
SELECT 
  '68703e85-cfb2-441d-b00c-b4217b39416d',
  'WELCOME',
  'Bienvenida',
  '¡Bienvenido a nuestro gimnasio!',
  E'Hola {userName},\n\n¡Bienvenido! Estamos emocionados de tenerte con nosotros.\n\nTu cuenta ha sido creada exitosamente. Ya puedes comenzar a disfrutar de todos nuestros servicios.\n\nDatos de acceso:\n- Usuario: {email}\n\n¡Nos vemos pronto!',
  '{"userName": "Nombre del usuario", "email": "Correo electrónico", "gymName": "Nombre del gimnasio"}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM automated_email_templates 
  WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d' AND type = 'WELCOME'
);

-- 5. ACCOUNT_INACTIVE
INSERT INTO automated_email_templates (gym_id, type, name, subject, content_body, available_variables, is_active)
SELECT 
  '68703e85-cfb2-441d-b00c-b4217b39416d',
  'ACCOUNT_INACTIVE',
  'Cuenta Inactiva',
  'Tu cuenta ha sido desactivada',
  E'Hola {clientName},\n\nTu membresía ha expirado y tu cuenta ha sido desactivada temporalmente.\n\nPara reactivar tu cuenta y seguir disfrutando de nuestros servicios, por favor renueva tu membresía.\n\nEstamos aquí para ayudarte. Contáctanos para más información.',
  '{"clientName": "Nombre del cliente", "lastPaymentDate": "Fecha último pago", "gymPhone": "Teléfono del gimnasio"}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM automated_email_templates 
  WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d' AND type = 'ACCOUNT_INACTIVE'
);

-- Verificar plantillas creadas
SELECT 
  type, 
  name, 
  is_active,
  created_at
FROM automated_email_templates
WHERE gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d'
ORDER BY type;
