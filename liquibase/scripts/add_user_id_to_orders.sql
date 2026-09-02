-- Adds a stable user identifier (Keycloak "sub" claim) to the orders table
-- so that listing orders can be scoped to a specific user by their immutable
-- id instead of a display name. This complements the existing `customer`
-- column which we still keep for backwards-compatible display purposes.
ALTER TABLE public.orders
  ADD COLUMN user_id varchar(128);