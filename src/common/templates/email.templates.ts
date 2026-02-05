
export const theme = {
  primary: '#4F46E5', // Indigo 600
  secondary: '#1F2937', // Gray 800
  text: '#374151', // Gray 700
  background: '#F3F4F6', // Gray 100
  white: '#FFFFFF',
  error: '#EF4444',
};

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${theme.background}; }
    .container { max-width: 600px; margin: 40px auto; background: ${theme.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: ${theme.secondary}; padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: ${theme.white}; letter-spacing: 1px; font-size: 24px; }
    .content { padding: 40px 30px; color: ${theme.text}; line-height: 1.6; }
    .footer { background: ${theme.background}; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
    .btn { display: inline-block; padding: 12px 24px; background-color: ${theme.primary}; color: ${theme.white}; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .code-block { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${theme.secondary}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EventSphere</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} EventSphere. All rights reserved.</p>
      <p>123 Community Lane, Innovation City</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  welcome: (name: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">Welcome, ${name}! 👋</h2>
    <p>We are absolutely thrilled to have you join <b>EventSphere</b>. You've just taken the first step towards discovering amazing local communities and events.</p>
    <p>Here's what you can do right now:</p>
    <ul style="padding-left: 20px;">
        <li>🔍 Discover events happening nearby</li>
        <li>👥 Join communities that match your interests</li>
        <li>📅 RSVP and manage your social calendar</li>
    </ul>
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="btn">Explore Events</a>
    </div>
  `, 'Welcome to EventSphere'),

  verification: (name: string, code: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">Verify Your Email</h2>
    <p>Hi ${name},</p>
    <p>Please use the following One-Time Password (OTP) to complete your registration. This code is valid for <b>24 hours</b>.</p>
    <div class="code-block">
        <div class="otp">${code}</div>
    </div>
    <p style="font-size: 14px; text-align: center;">If you didn't request this code, please ignore this email.</p>
  `, 'Verify your Account'),

  eventUpdate: (name: string, eventTitle: string, changes: Record<string, { old: Date | string, new: Date | string }>, eventId: string) => {
    let changeList = '';
    
    if (changes.time) {
        const oldTime = new Date(changes.time.old).toLocaleString();
        const newTime = new Date(changes.time.new).toLocaleString();
        changeList += `<p><strong>⏰ Time Changed:</strong><br><span style="text-decoration: line-through; color: #999;">${oldTime}</span> &rarr; <span style="color: #d97706; font-weight: bold;">${newTime}</span></p>`;
    }
    
    if (changes.location) {
        changeList += `<p><strong>📍 Location Changed:</strong><br><span style="text-decoration: line-through; color: #999;">${changes.location.old}</span> &rarr; <span style="color: #d97706; font-weight: bold;">${changes.location.new}</span></p>`;
    }

    if (!changeList) {
        changeList = '<p>Details of the event have been updated.</p>';
    }

    return baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">Event Update: ${eventTitle}</h2>
    <p>Hi ${name},</p>
    <p>There has been an important update to an event you're attending.</p>
    
    <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 20px; margin: 20px 0;">
        ${changeList}
    </div>

    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}" class="btn">View Event Details</a>
    </div>
  `, `Update: ${eventTitle}`);
  },

  roleApproved: (name: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">You're an Organizer! 🎉</h2>
    <p>Hi ${name},</p>
    <p>Congratulations! Your request to become an <b>Organizer</b> has been approved.</p>
    <p>You can now:</p>
    <ul style="padding-left: 20px;">
        <li>Create and manage your own events</li>
        <li>Build communities</li>
        <li>Access the Organizer Dashboard</li>
    </ul>
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>
    </div>
  `, 'Role Upgrade Approved'),

  rsvpConfirmation: (name: string, eventTitle: string, ticketCode?: string, qrCodeData?: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">You're Going! 🎟️</h2>
    <p>Hi ${name},</p>
    <p>Your RSVP for <b>${eventTitle}</b> has been confirmed.</p>
    
    ${qrCodeData ? `
    <p>Here is your Ticket QR Code:</p>
    <div style="text-align: center; margin: 20px 0;">
        <img src="${qrCodeData}" alt="Ticket QR Code" style="width: 200px; height: 200px; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
    </div>
    ` : ''}

    ${ticketCode ? `
    <p>Ticket Code:</p>
    <div class="code-block">
        <div class="otp" style="font-size: 24px; letter-spacing: 2px;">${ticketCode}</div>
    </div>
    ` : ''}

    <p style="text-align: center; color: #666;">Please present this QR code at the entrance.</p>

    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events" class="btn">View Ticket</a>
    </div>
  `, `RSVP Confirmed: ${eventTitle}`),

  invitation: (name: string, inviterName: string, eventTitle: string, link: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">You're Invited! 💌</h2>
    <p>Hi ${name},</p>
    <p><b>${inviterName}</b> has invited you to join <b>${eventTitle}</b>.</p>
    <p>Don't miss out on this event!</p>
    <div style="text-align: center;">
        <a href="${link}" class="btn">Accept Invitation</a>
    </div>
  `, `Invitation: ${eventTitle}`),

  recurringEventCreated: (name: string, eventTitle: string, date: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">New Event Instance Created 🔄</h2>
    <p>Hi ${name},</p>
    <p>A new instance of your recurring event <b>${eventTitle}</b> has been automatically created.</p>
    <p><b>Date:</b> ${date}</p>
    <p>You can manage this event from your dashboard.</p>
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">Manage Event</a>
    </div>
  `, `Recurring Event: ${eventTitle}`),

  communityEventNew: (name: string, communityName: string, eventTitle: string, eventId: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">New Event in ${communityName}! 📅</h2>
    <p>Hi ${name},</p>
    <p>A new event <b>${eventTitle}</b> has been posted in the <b>${communityName}</b> community.</p>
    <p>Check it out and RSVP now!</p>
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}" class="btn">View Event</a>
    </div>
  `, `New Event in ${communityName}`),

  communityInvite: (toEmail: string, communityName: string, inviterName: string) => baseTemplate(`
    <h2 style="color: ${theme.secondary}; margin-top: 0;">You're Invited to a Community! 🏘️</h2>
    <p>Hi there,</p>
    <p><b>${inviterName}</b> has invited you to join the <b>${communityName}</b> community on EventSphere.</p>
    <p>Connect with people who share your interests!</p>
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/register" class="btn">Join Now</a>
    </div>
    <p style="font-size: 12px; text-align: center; margin-top: 20px;">If you already have an account, the invitation will be waiting for you in your notifications.</p>
  `, `Invitation to join ${communityName}`),
};
