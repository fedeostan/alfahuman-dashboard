-- Run in your Vercel Postgres / Neon SQL editor (Neon project: nameless-art-22629763)
-- Creates the unified `shipments` ledger — the single source of truth for the
-- AlphaHackers shipping pipeline (SouthPost + dashboard).
--
-- One table, three roles:
--   1. dedup ledger   — `order_ref` UNIQUE prevents the Shopify-vs-manual double-entry
--                        from booking two couriers (both channels UPSERT here).
--   2. dashboard view — Santi/Mati see pending + active shipments and confirm/cancel.
--   3. confirm queue  — a human flips `pending_confirmation` -> `confirmed`; PRD 4
--                        (guía creation) later consumes `confirmed` rows.
--
-- Reversible: this is pure setup (CREATE TABLE IF NOT EXISTS). It supersedes the
-- earlier `setup-southpost.sql` draft (`southpost_shipments`, keyed on `remito`);
-- that table modeled only post-shipment tracking and is left in place untouched.
--
-- Master plan: ~/.claude/plans/i-need-you-to-replicated-biscuit.md  (PRD 0)

CREATE TABLE IF NOT EXISTS shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref         TEXT UNIQUE NOT NULL,        -- dedup key + SouthPost remito (#1810 / JARVIS-<ts>)
  source            TEXT NOT NULL,               -- 'shopify' | 'manual'
  status            TEXT NOT NULL DEFAULT 'pending_confirmation',
                    -- pending_confirmation | confirmed | guia_created | in_transit | delivered | cancelled | error
  cliente           TEXT,
  telefono          TEXT,
  direccion         TEXT,
  localidad         TEXT,
  provincia         TEXT,
  cp                TEXT,
  codigo_servicio   TEXT,                        -- PACK (delivery) | PACK5 (pickup)
  productos         JSONB,                       -- [{descripcion, quantity}]
  formalidad        TEXT,                        -- White | Azul
  fc                TEXT,                        -- Xubio invoice number (optional link)
  southpost_guia    BIGINT,                      -- set on creation; idempotency guard
  estado            TEXT,
  codigo_estado     TEXT,
  tracking_history  JSONB DEFAULT '[]'::jsonb,
  confirmed_by      TEXT,
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shipments_status_idx ON shipments (status);
