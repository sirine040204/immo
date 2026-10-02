import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("media") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    if (!apiUser || !apiSecret) {
      return NextResponse.json({ error: "Clés API Sightengine manquantes" }, { status: 500 });
    }

    // Prepare FormData for Sightengine
    const sightengineData = new FormData();
    sightengineData.append("media", file);
    sightengineData.append("models", "nudity-2.0,gore,offensive"); // Detecting nudity, blood/gore, and offensive gestures/flags
    sightengineData.append("api_user", apiUser);
    sightengineData.append("api_secret", apiSecret);

    const response = await axios.post("https://api.sightengine.com/1.0/check.json", sightengineData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data;

    // Analyze the results
    let isBad = false;
    let reason = "";

    // Check Nudity
    if (data.nudity) {
      if (data.nudity.sexual_activity > 0.5 || data.nudity.sexual_display > 0.5 || data.nudity.erotica > 0.8) {
        isBad = true;
        reason = "Contenu explicite ou nudité";
      }
    }

    // Check Gore / Blood / Violence
    if (data.gore) {
      if (data.gore.prob > 0.5) {
        isBad = true;
        reason = "Violence, sang ou contenu choquant";
      }
    }

    // Check Offensive (Middle finger, extremist flags, etc.)
    if (data.offensive) {
      if (data.offensive.prob > 0.5) {
        isBad = true;
        reason = "Gestes offensants ou symboles extrémistes";
      }
    }

    return NextResponse.json({ isBad, reason, raw: data });

  } catch (error: any) {
    console.error("Sightengine Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Erreur lors de la modération de l'image" },
      { status: 500 }
    );
  }
}
