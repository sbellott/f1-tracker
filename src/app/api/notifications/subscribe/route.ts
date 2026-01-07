import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Schema for push subscription
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const data = subscribeSchema.parse(body);

    // Upsert the subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent,
      },
    });

    // Also update user preference to enable push
    await prisma.user.update({
      where: { id: session.user.id },
      data: { notifyPush: true },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (endpoint) {
      // Delete specific subscription
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: session.user.id,
          endpoint: endpoint,
        },
      });
    } else {
      // Delete all subscriptions for user
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id },
      });
    }

    // Update user preference
    await prisma.user.update({
      where: { id: session.user.id },
      data: { notifyPush: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription" },
      { status: 500 }
    );
  }
}

// GET - Get VAPID public key
export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: "Push notifications non configurées" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey: vapidPublicKey });
}
