-- Fix SQL Injection Pattern in Supabase
-- Run this in your Supabase SQL Editor to fix the overly aggressive pattern matching

-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS guestbook_spam_prevention ON guestbook_entries;

-- Drop the old function
DROP FUNCTION IF EXISTS prevent_spam();

-- Create a much more lenient spam prevention function
-- This only blocks actual dangerous patterns, not common English words
CREATE OR REPLACE FUNCTION prevent_spam()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic length validation
  IF LENGTH(TRIM(NEW.display_name)) < 1 OR LENGTH(TRIM(NEW.display_name)) > 100 THEN
    RAISE EXCEPTION 'Display name must be between 1 and 100 characters';
  END IF;

  IF LENGTH(TRIM(NEW.message)) < 1 OR LENGTH(TRIM(NEW.message)) > 10000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 10000 characters';
  END IF;

  -- Only block actual dangerous patterns, not common words

  -- Only block specific SQL injection syntax patterns, not individual words
  IF NEW.message ~* '''\s*;\s*(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\s*' OR
     NEW.message ~* '''\s*OR\s*''\w*''\s*=\s*''\w*''' OR
     NEW.display_name ~* '''\s*;\s*(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\s*' OR
     NEW.display_name ~* '''\s*OR\s*''\w*''\s*=\s*''\w*''' THEN
    RAISE EXCEPTION 'Security: SQL injection attempts detected';
  END IF;

  -- Only block actual XSS patterns
  IF NEW.message ~* 'javascript\s*:' OR
     NEW.message ~* 'on\w+\s*=\s*[''"][^''"]*[''"]' OR
     NEW.message ~* '<\s*script[^>]*>' OR
     NEW.message ~* '<\s*iframe[^>]*>' OR
     NEW.display_name ~* 'javascript\s*:' OR
     NEW.display_name ~* 'on\w+\s*=\s*[''"][^''"]*[''"]' OR
     NEW.display_name ~* '<\s*script[^>]*>' OR
     NEW.display_name ~* '<\s*iframe[^>]*>' THEN
    RAISE EXCEPTION 'Security: Potential XSS attack detected';
  END IF;

  -- Allow HTML tags that are safe, but block script tags
  IF NEW.message ~* '<\s*\/?\s*(script|iframe|object|embed|form|input|button|link|meta|style)\b[^>]*>' OR
     NEW.display_name ~* '<\s*\/?\s*(script|iframe|object|embed|form|input|button|link|meta|style)\b[^>]*>' THEN
    RAISE EXCEPTION 'Security: Dangerous HTML tags are not allowed';
  END IF;

  -- Block actual URLs (not conceptual mentions)
  IF NEW.message ~* 'https?:\/\/[^\s]+' OR
     NEW.display_name ~* 'https?:\/\/[^\s]+' THEN
    RAISE EXCEPTION 'Security: URLs are not allowed';
  END IF;

  -- Block actual email addresses (not conceptual mentions)
  IF NEW.message ~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' OR
     NEW.display_name ~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' THEN
    RAISE EXCEPTION 'Security: Email addresses are not allowed';
  END IF;

  -- Block actual phone numbers
  IF NEW.message ~* '\b\d{3}[-.]?\d{3}[-.]?\d{4}\b' OR
     NEW.message ~* '\+\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b' OR
     NEW.display_name ~* '\b\d{3}[-.]?\d{3}[-.]?\d{4}\b' OR
     NEW.display_name ~* '\+\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b' THEN
    RAISE EXCEPTION 'Security: Phone numbers are not allowed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER guestbook_spam_prevention
  BEFORE INSERT ON guestbook_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_spam();
