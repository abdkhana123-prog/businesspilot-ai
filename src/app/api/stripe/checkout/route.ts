import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";


const priceIds: Record<string, string | undefined> = {
  Starter: process.env.STRIPE_STARTER_PRICE_ID,
  Growth: process.env.STRIPE_GROWTH_PRICE_ID,
  Scale: process.env.STRIPE_SCALE_PRICE_ID,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const plan = String(body.plan || "");
    const workspaceId = String(body.workspaceId || "");
    const customerEmail = String(body.email || "");

    if (!["Starter", "Growth", "Scale"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 },
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is missing." },
        { status: 400 },
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Please log in before choosing a plan." },
        { status: 401 },
      );
    }

    const priceId = priceIds[plan];

    if (!priceId) {
      return NextResponse.json(
        {
          error: `${plan} Price ID is missing in .env.local.`,
        },
        { status: 500 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: customerEmail,

      success_url: `${appUrl}/pricing?success=1`,
      cancel_url: `${appUrl}/pricing?cancelled=1`,

      metadata: {
        workspace_id: workspaceId,
        plan_name: plan,
      },

      subscription_data: {
        metadata: {
          workspace_id: workspaceId,
          plan_name: plan,
        },
      },
    } );

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("CHECKOUT_ROUTE_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create Stripe checkout.",
      },
      { status: 500 },
    );
  }
}
