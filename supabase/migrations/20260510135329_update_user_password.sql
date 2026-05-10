-- Update password login untuk user Sumbermutiaraelektronik@gmail.com
UPDATE auth.users
SET encrypted_password = crypt('Telolpelek23', gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = lower('Sumbermutiaraelektronik@gmail.com');
