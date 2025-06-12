import 'server-only';

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  teamName: string;
  role: string;
  inviteToken: string;
  expiresAt: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  teamName,
  role,
  inviteToken,
  expiresAt,
}: SendInviteEmailParams) {
  // Supabase uses Resend for email sending
  // First, we need to configure email templates in Supabase Dashboard

  // For now, we'll prepare the email data structure
  const emailData = {
    to: [to],
    subject: `You're invited to join ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join ${teamName}!</h2>
        
        <p>${inviterName} has invited you to join as a ${role} on the ${teamName} coaching platform.</p>
        
        <p>Click the link below to accept your invitation:</p>
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${inviteToken}" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Accept Invitation
        </a>
        
        <p style="color: #666; font-size: 14px;">
          This invitation will expire on ${new Date(expiresAt).toLocaleDateString()}.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
      You've been invited to join ${teamName}!
      
      ${inviterName} has invited you to join as a ${role} on the ${teamName} coaching platform.
      
      Accept your invitation here: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/accept-invite?token=${inviteToken}
      
      This invitation will expire on ${new Date(expiresAt).toLocaleDateString()}.
    `,
  };

  // TODO: Implement actual email sending via Supabase Edge Functions
  // For now, we'll just log the email data
  console.log('Email would be sent:', emailData);

  // In production, you would:
  // 1. Create a Supabase Edge Function for sending emails
  // 2. Configure Resend API in Supabase
  // 3. Call the edge function from here

  return { success: true, emailData };
}

export async function sendBulkInviteEmails(invitations: any[]) {
  const results = await Promise.allSettled(
    invitations.map((invitation) =>
      sendInviteEmail({
        to: invitation.email,
        inviterName: invitation.inviterName || 'Your coach',
        teamName: invitation.teamName,
        role: invitation.role,
        inviteToken: invitation.id, // Using invitation ID as token
        expiresAt: invitation.expires_at,
      })
    )
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed };
}
