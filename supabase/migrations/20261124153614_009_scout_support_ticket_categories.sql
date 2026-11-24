ALTER TABLE public.support_tickets
  ADD COLUMN category text NOT NULL DEFAULT 'Login Probleme'
  CONSTRAINT support_tickets_category_check
  CHECK (category IN (
    'Probleme bei Spieler erstellen',
    'Probleme bei Spieler bearbeiten',
    'Probleme bei der Datenbankabfrage',
    'Probleme bei der gesamten Datenbank',
    'Login Probleme',
    'Anderes Anliegen'
  ));

COMMENT ON COLUMN public.support_tickets.category
  IS 'Vom Scout ausgewählter Grund der Supportanfrage.';
