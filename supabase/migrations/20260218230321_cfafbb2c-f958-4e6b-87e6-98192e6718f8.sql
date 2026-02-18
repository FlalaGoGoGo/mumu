
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_offset integer;
  v_result json;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count
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
          CASE
            WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming'
            WHEN CURRENT_DATE > e.end_date::date THEN 'Past'
            ELSE 'Ongoing'
          END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming' ELSE 'Ongoing' END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN CURRENT_DATE <= e.end_date::date THEN 'Ongoing' ELSE 'Past' END
        ELSE 'TBD'
      END
    ) = ANY(p_statuses))
    AND (p_date_from IS NULL OR e.end_date IS NULL OR e.end_date::date >= p_date_from::date)
    AND (p_date_to IS NULL OR e.start_date IS NULL OR e.start_date::date <= p_date_to::date);

  -- Data
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'data', COALESCE(json_agg(row_to_json(t)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT
      e.exhibition_id,
      e.museum_id,
      e.exhibition_name,
      e.cover_image_url,
      e.start_date,
      e.end_date,
      e.official_url,
      e.short_description,
      e.related_artworks,
      m.name AS museum_name,
      m.city,
      m.state,
      m.country,
      m.lat AS museum_lat,
      m.lng AS museum_lng,
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE
            WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming'
            WHEN CURRENT_DATE > e.end_date::date THEN 'Past'
            ELSE 'Ongoing'
          END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming' ELSE 'Ongoing' END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN CURRENT_DATE <= e.end_date::date THEN 'Ongoing' ELSE 'Past' END
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
            CASE
              WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming'
              WHEN CURRENT_DATE > e.end_date::date THEN 'Past'
              ELSE 'Ongoing'
            END
          WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
            CASE WHEN CURRENT_DATE < e.start_date::date THEN 'Upcoming' ELSE 'Ongoing' END
          WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
            CASE WHEN CURRENT_DATE <= e.end_date::date THEN 'Ongoing' ELSE 'Past' END
          ELSE 'TBD'
        END
      ) = ANY(p_statuses))
      AND (p_date_from IS NULL OR e.end_date IS NULL OR e.end_date::date >= p_date_from::date)
      AND (p_date_to IS NULL OR e.start_date IS NULL OR e.start_date::date <= p_date_to::date)
    ORDER BY
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE
            WHEN CURRENT_DATE < e.start_date::date THEN 2
            WHEN CURRENT_DATE > e.end_date::date THEN 3
            ELSE 1
          END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN CURRENT_DATE < e.start_date::date THEN 2 ELSE 1 END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN CURRENT_DATE <= e.end_date::date THEN 1 ELSE 3 END
        ELSE 4
      END,
      CASE
        WHEN e.end_date IS NOT NULL AND CURRENT_DATE <= e.end_date::date THEN e.end_date::date
        ELSE NULL
      END ASC NULLS LAST,
      e.start_date ASC NULLS LAST
    OFFSET v_offset
    LIMIT p_page_size
  ) t;

  RETURN v_result;
END;
$$;
