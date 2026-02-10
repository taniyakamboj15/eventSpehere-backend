import nodemailer from 'nodemailer';
import { ApiError } from '../common/utils/ApiError';
import { templateService } from './template.service';
import { env } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    } else {
        console.warn('⚠️ SMTP credentials not found. Email service running in MOCK mode. Emails will be logged to console.');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
        console.log(`\n📧 [MOCK EMAIL] To: ${to}\n📝 Subject: ${subject}\n📄 Content: ${html.replace(/<[^>]*>?/gm, '').trim()}\n`);
        return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
        to,
        subject,
        html,
      });

      console.log(`Email sent: ${info.messageId}`);
      if (env.SMTP_HOST.includes('ethereal')) {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

    } catch (error) {
      console.error('Error sending email:', error);
      throw new ApiError(500, 'Failed to send email notification');
    }
  }


  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = await templateService.render('welcome', { name });
    await this.sendEmail(to, 'Welcome to EventSphere!', html);
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const html = await templateService.render('verification', { name, code: token });
    await this.sendEmail(to, 'Verify your EventSphere account', html);
  }

  async sendEventUpdateEmail(to: string, name: string, eventTitle: string, changes: Record<string, { old: Date | string, new: Date | string }>, eventId: string): Promise<void> {
    const formattedChanges = { ...changes };
    if (changes.time) {
        formattedChanges.time = {
            old: new Date(changes.time.old).toLocaleString(),
            new: new Date(changes.time.new).toLocaleString()
        };
    }

    const html = await templateService.render('event-update', { name, eventTitle, changes: formattedChanges, eventId });
    await this.sendEmail(to, `Update: ${eventTitle}`, html);
  }

  async sendUpgradeApprovedEmail(to: string, name: string): Promise<void> {
    const html = await templateService.render('role-approved', { name });
    await this.sendEmail(to, 'You are now an Organizer!', html);
  }

  async sendRsvpConfirmationEmail(to: string, name: string, eventTitle: string, ticketCode?: string, qrCodeData?: string): Promise<void> {
    const html = await templateService.render('rsvp-confirmation', { name, eventTitle, ticketCode, qrCodeData });
    await this.sendEmail(to, `Ticket: ${eventTitle}`, html);
  }

  async sendInvitationEmail(to: string, name: string, inviterName: string, eventTitle: string, eventId: string): Promise<void> {
    const link = `${env.CLIENT_URL}/events/${eventId}`;
    const html = await templateService.render('invitation', { name, inviterName, eventTitle, link });
    await this.sendEmail(to, `Invitation: ${eventTitle}`, html);
  }

  async sendRecurringEventCreatedEmail(to: string, name: string, eventTitle: string, date: string): Promise<void> {
    const html = await templateService.render('recurring-event-created', { name, eventTitle, date });
    await this.sendEmail(to, `New Event: ${eventTitle}`, html);
  }

  async sendCommunityEventEmail(to: string, name: string, communityName: string, eventTitle: string, eventId: string): Promise<void> {
    const html = await templateService.render('community-event-new', { name, communityName, eventTitle, eventId });
    await this.sendEmail(to, `New Event in ${communityName}`, html);
  }

  async sendCommunityInviteEmail(to: string, communityName: string, inviterName: string): Promise<void> {
    const html = await templateService.render('community-invite', { inviterName, communityName });
    await this.sendEmail(to, `Invitation: Join ${communityName}`, html);
  }
}

export const emailService = new EmailService();
