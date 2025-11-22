import { NextResponse } from "next/server";

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const apiSecret = process.env.KIT_API_SECRET;
    const formId = process.env.KIT_FORM_ID;

    if (!apiSecret || !formId) {
      console.error("Missing Kit configuration. Set KIT_API_SECRET and KIT_FORM_ID.");
      return NextResponse.json(
        { error: "Subscription service is unavailable right now." },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          api_secret: apiSecret,
          email: email.trim(),
        }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        (data?.errors && Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors[0]
          : "Unable to subscribe right now.");
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    return NextResponse.json({
      message: "Success! You're on the list.",
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json(
      { error: "Unexpected error. Please try again later." },
      { status: 500 },
    );
  }
}

