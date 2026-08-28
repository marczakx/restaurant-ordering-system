CREATE TABLE public.users (
	id SERIAL PRIMARY KEY,
	username varchar(50) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) NOT NULL,
	enabled bool NOT NULL,
	account_non_expired bool NULL DEFAULT true,
	account_non_locked bool NOT NULL,
	credentials_non_expired bool NOT NULL,
	full_name varchar NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
