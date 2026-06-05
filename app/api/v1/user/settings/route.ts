import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailOnDetection, emailWeeklyDigest, emailRotationReminder, slackWebhookUrl, plan } = await request.json();

    const updateData: any = {};
    if (emailOnDetection !== undefined) updateData.emailOnDetection = !!emailOnDetection;
    if (emailWeeklyDigest !== undefined) updateData.emailWeeklyDigest = !!emailWeeklyDigest;
    if (emailRotationReminder !== undefined) updateData.emailRotationReminder = !!emailRotationReminder;
    if (slackWebhookUrl !== undefined) updateData.slackWebhookUrl = slackWebhookUrl === '' ? null : slackWebhookUrl;
    if (plan !== undefined) updateData.plan = plan;

    const updatedUser = await prisma.user.update({
      where: { email: authUser.email },
      data: updateData
    });

    // Also sync the subscription table if plan is changed
    if (plan !== undefined) {
      const planToSubPlanMap: Record<string, string> = {
        'BASIC': 'BASIC',
        'PRO': 'PRO',
        'TEAM': 'TEAM'
      };
      
      const subPlan = planToSubPlanMap[plan];
      if (subPlan) {
        await prisma.subscription.upsert({
          where: { userId: updatedUser.id },
          update: {
            plan: subPlan as any,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          create: {
            userId: updatedUser.id,
            plan: subPlan as any,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      } else {
        // If downgrading to FREE, delete/cancel subscription
        try {
          await prisma.subscription.delete({
            where: { userId: updatedUser.id }
          });
        } catch {}
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
