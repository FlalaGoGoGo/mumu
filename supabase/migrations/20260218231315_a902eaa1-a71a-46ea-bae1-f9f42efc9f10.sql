
-- Drop ALL overloaded versions of get_exhibitions_page
DROP FUNCTION IF EXISTS public.get_exhibitions_page(integer, integer, text, text, text, text, text[], boolean, date, date);
DROP FUNCTION IF EXISTS public.get_exhibitions_page(integer, integer, text, text, text, text, text[], boolean, date, date, text, boolean);
DROP FUNCTION IF EXISTS public.get_exhibitions_page(integer, integer, text, text, text, text, text[], boolean, text, text, text, boolean);

-- Recreate single canonical version with text date params
CREATE OR REPLACE FUNCTION public.get_exhibitions_page(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_search text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_statuses text[] DEFAULT NULL,
  p_closing_soon boolean DEFAULT false,
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL,
  p_museum_id text DEFAULT NULL,
  p_has_image boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_total integer;
  v_offset integer;
  v_result json;
  v_today date := current_date;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT count(*) INTO v_total
  FROM exhibitions e
  JOIN museums m ON m.museum_id = e.museum_id
  WHERE
    (p_search IS NULL OR (
      e.exhibition_name ILIKE '%' || p_search || '%'
      OR e.short_description ILIKE '%' || p_search || '%'
      OR m.name ILIKE '%' || p_search || '%'
    ))
    AND (p_country IS NULL OR m.country = p_country)
    AND (p_state IS NULL OR m.state = p_state)
    AND (p_city IS NULL OR m.city = p_city)
    AND (p_museum_id IS NULL OR e.museum_id = p_museum_id)
    AND (p_has_image = false OR (e.cover_image_url IS NOT NULL AND e.cover_image_url <> ''))
    AND (p_statuses IS NULL OR (
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today < e.start_date THEN 'Upcoming'
               WHEN v_today > e.end_date THEN 'Past'
               ELSE 'Ongoing' END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN v_today < e.start_date THEN 'Upcoming' ELSE 'Ongoing' END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today <= e.end_date THEN 'Ongoing' ELSE 'Past' END
        ELSE 'TBD'
      END
    ) = ANY(p_statuses))
    AND (p_date_from IS NULL OR e.end_date IS NULL OR e.end_date >= p_date_from::date)
    AND (p_date_to IS NULL OR e.start_date IS NULL OR e.start_date <= p_date_to::date);

  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'data', COALESCE(json_agg(row_to_json(t)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT
      e.exhibition_id, e.museum_id, e.exhibition_name, e.cover_image_url,
      e.start_date, e.end_date, e.official_url, e.short_description, e.related_artworks,
      m.name AS museum_name, m.city, m.state, m.country,
      m.lat AS museum_lat, m.lng AS museum_lng,
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today < e.start_date THEN 'Upcoming'
               WHEN v_today > e.end_date THEN 'Past'
               ELSE 'Ongoing' END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN v_today < e.start_date THEN 'Upcoming' ELSE 'Ongoing' END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today <= e.end_date THEN 'Ongoing' ELSE 'Past' END
        ELSE 'TBD'
      END AS status
    FROM exhibitions e
    JOIN museums m ON m.museum_id = e.museum_id
    WHERE
      (p_search IS NULL OR (
        e.exhibition_name ILIKE '%' || p_search || '%'
        OR e.short_description ILIKE '%' || p_search || '%'
        OR m.name ILIKE '%' || p_search || '%'
      ))
      AND (p_country IS NULL OR m.country = p_country)
      AND (p_state IS NULL OR m.state = p_state)
      AND (p_city IS NULL OR m.city = p_city)
      AND (p_museum_id IS NULL OR e.museum_id = p_museum_id)
      AND (p_has_image = false OR (e.cover_image_url IS NOT NULL AND e.cover_image_url <> ''))
      AND (p_statuses IS NULL OR (
        CASE
          WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
            CASE WHEN v_today < e.start_date THEN 'Upcoming'
                 WHEN v_today > e.end_date THEN 'Past'
                 ELSE 'Ongoing' END
          WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
            CASE WHEN v_today < e.start_date THEN 'Upcoming' ELSE 'Ongoing' END
          WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
            CASE WHEN v_today <= e.end_date THEN 'Ongoing' ELSE 'Past' END
          ELSE 'TBD'
        END
      ) = ANY(p_statuses))
      AND (p_date_from IS NULL OR e.end_date IS NULL OR e.end_date >= p_date_from::date)
      AND (p_date_to IS NULL OR e.start_date IS NULL OR e.start_date <= p_date_to::date)
    ORDER BY
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today < e.start_date THEN 2
               WHEN v_today > e.end_date THEN 3
               ELSE 1 END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN v_today < e.start_date THEN 2 ELSE 1 END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today <= e.end_date THEN 1 ELSE 3 END
        ELSE 4
      END,
      e.end_date ASC NULLS LAST,
      e.start_date ASC NULLS LAST
    OFFSET v_offset LIMIT p_page_size
  ) t;

  RETURN v_result;
END;
$function$;
