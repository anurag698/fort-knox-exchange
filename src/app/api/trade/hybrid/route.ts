
import { NextResponse } from "next/server";
import { validateHybridOrder } from "@/lib/order-validator";
import { HybridOrderRequest } from "@/lib/order-types";
// import { saveOrderToDB } from "@/lib/db";  <-- you will connect this later

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HybridOrderRequest;

    // Validate & normalize
    const order = validateHybridOrder(body);

    // Save to DB (pseudo function — you will implement your backend)
    // const orderId = await saveOrderToDB(order);

    const orderId = crypto.randomUUID(); // temporary mock

    return NextResponse.json({
      orderId,
      status: "ACCEPTED",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "REJECTED",
        message: err.message,
      },
      { status: 400 }
    );
  }
}
