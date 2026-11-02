import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Simulated SCADA/PLC data feed for Plant Alpha
// In production, this would read from an OPC-UA / Modbus / MQTT bridge.
// Here we generate realistic live values around a steady-state baseline
// with small time-based oscillations to mimic sensor noise.

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const t = Date.now() / 1000;
  // small sinusoidal noise per channel
  const noise = (amp: number, period: number, phase = 0) =>
    amp * Math.sin((2 * Math.PI * t) / period + phase);

  const reading = {
    plantId: 'plant-alpha',
    timestamp: new Date().toISOString(),
    source: 'SCADA/PLC',
    tagQuality: 'GOOD',
    params: {
      flowRate: +(140 + noise(4, 45)).toFixed(1),         // L/min
      chlorineDosing: +(2.2 + noise(0.15, 60, 1)).toFixed(2), // mg/L
      filterPressure: +(3.0 + noise(0.12, 75, 2)).toFixed(2), // bar
      temperature: +(23.5 + noise(0.6, 120, 0.5)).toFixed(2), // °C
    },
  };

  return new Response(JSON.stringify(reading), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
