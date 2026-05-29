const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env values
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key not found in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  console.log("--- Supabase Diagnostics ---");
  console.log("URL:", supabaseUrl);

  // 1. Test "mensagens" table columns
  console.log("\nTesting 'mensagens' table:");
  const { data: msgData, error: msgError } = await supabase
    .from("mensagens")
    .select("*")
    .limit(1);
  if (msgError) {
    console.error("Error reading mensagens:", msgError);
  } else {
    console.log("Success! Columns:", Object.keys(msgData[0] || {}));
  }

  // 2. Test if "squad_mensagens" or similar exists
  console.log("\nTesting 'squad_mensagens' table:");
  const { data: smData, error: smError } = await supabase
    .from("squad_mensagens")
    .select("*")
    .limit(1);
  if (smError) {
    console.log("squad_mensagens does not exist or failed:", smError.message);
  } else {
    console.log("squad_mensagens exists! Columns:", Object.keys(smData[0] || {}));
  }

  // 3. Test if "squads" table columns
  console.log("\nTesting 'squads' table:");
  const { data: sqData, error: sqError } = await supabase
    .from("squads")
    .select("*")
    .limit(1);
  if (sqError) {
    console.error("Error reading squads:", sqError);
  } else {
    console.log("Success! Columns:", Object.keys(sqData[0] || {}));
  }

  // 4. Test "squad_members" table
  console.log("\nTesting 'squad_members' table:");
  const { data: sMemData, error: sMemError } = await supabase
    .from("squad_members")
    .select("*")
    .limit(1);
  if (sMemError) {
    console.error("Error reading squad_members:", sMemError);
  } else {
    console.log("Success! Columns:", Object.keys(sMemData[0] || {}));
  }

  // 5. Test "stories" table
  console.log("\nTesting 'stories' table:");
  const { data: stData, error: stError } = await supabase
    .from("stories")
    .select("*")
    .limit(1);
  if (stError) {
    console.error("Error reading stories:", stError);
  } else {
    console.log("Success! Columns:", Object.keys(stData[0] || {}));
  }

  // 6. Test "challenges" table
  console.log("\nTesting 'challenges' table:");
  const { data: chData, error: chError } = await supabase
    .from("challenges")
    .select("*")
    .limit(1);
  if (chError) {
    console.error("Error reading challenges:", chError);
  } else {
    console.log("Success! Columns:", Object.keys(chData[0] || {}));
  }
}

runDiagnostics();
