import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const klantId = formData.get("klant_id");
  const categorie = formData.get("categorie");
  const richting = formData.get("richting");
  const naam = formData.get("naam");

  if (!file || !klantId) {
    return NextResponse.json({ error: "File en klant_id zijn verplicht" }, { status: 400 });
  }

  // Get gebruiker's kantoor_id
  const { data: geb } = await supabase
    .from("gebruikers")
    .select("kantoor_id")
    .eq("id", user.id)
    .single();

  // Upload to Supabase Storage
  const fileName = `${geb.kantoor_id}/${klantId}/${Date.now()}_${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("gedeelde-documenten")
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Create document record
  const { data, error } = await supabase
    .from("documenten")
    .insert({
      kantoor_id: geb.kantoor_id,
      klant_id: klantId,
      naam: naam || file.name,
      bestandsnaam: file.name,
      bucket_pad: fileName,
      mime_type: file.type,
      bestandsgrootte: file.size,
      categorie: categorie || "overig_naar_werkgever",
      richting: richting || "adviseur_naar_werkgever",
      aangemaakt_door: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
