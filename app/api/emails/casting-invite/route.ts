import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@clerk/nextjs/server';
import { CastingInviteTemplate } from '@/components/emails/casting-invite-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, creatorName, castingTitle, clientName, compensation, responseDeadline } = body;

    if (!to || !creatorName || !castingTitle || !clientName || compensation === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Bubble Ads Castings <castings@casting-invites.bubbleads.nl>',
      to: [to],
      subject: `Casting opportunity: ${castingTitle}`,
      react: CastingInviteTemplate({
        creatorName,
        castingTitle,
        clientName,
        compensation,
        responseDeadline,
        // Let the template handle the URL construction
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}