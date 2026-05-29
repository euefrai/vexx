const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRuns() {
  console.log("Checking 'runs' table:");
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .limit(1);
  if (error) {
    console.error("Error reading runs:", error);
  } else {
    console.log("Runs columns:", Object.keys(data[0] || {}));
  }
}

checkRuns();
