-- Run in your Neon SQL editor
-- Creates the tables the n8n Southpost tracking workflow will write into.
-- Schema proposed in the n8n-side handoff doc — not yet a finalized contract,
-- confirm column names with that workflow before relying on them long-term.

CREATE TABLE IF NOT EXISTS southpost_shipments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  remito            TEXT        UNIQUE NOT NULL,  -- our reference, e.g. Shopify order #
  guia              INTEGER,                       -- Southpost's guía number (from guias.json response)
  codigo_servicio   TEXT,                           -- PACK | PACK5
  estado            TEXT,                           -- latest human-readable status
  codigo_estado     TEXT,                           -- latest status code
  destinatario      TEXT,
  localidad         TEXT,
  provincia         TEXT,
  importe           NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS southpost_shipment_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id       UUID        REFERENCES southpost_shipments(id),
  estado            TEXT,
  codigo_estado     TEXT,
  occurred_at       TIMESTAMPTZ,
  raw_payload       JSONB,                          -- full webhook body, kept for debugging
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS southpost_shipment_events_shipment_id_idx
  ON southpost_shipment_events (shipment_id);
