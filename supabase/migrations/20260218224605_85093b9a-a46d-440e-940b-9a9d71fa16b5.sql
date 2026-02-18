
CREATE OR REPLACE FUNCTION public.get_exhibitions_page(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20,
  p_search text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_statuses text[] DEFAULT NULL,
  p_closing_soon boolean DEFAULT false,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_museum_id text DEFAULT NULL,
  p_has_image boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_total bigint;
  v_result json;
  v_today date := current_date;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Count
  SELECT count(*) INTO v_total
  FROM exhibitions e
  JOIN museums m ON m.museum_id = e.museum_id
  WHERE
    (p_search IS NULL OR (
      e.exhibition_name ILIKE '%' || p_search || '%' OR
      m.name ILIKE '%' || p_search || '%'
    ))
    AND (p_country IS NULL OR m.country = p_country)
    AND (p_state IS NULL OR m.state = p_state)
    AND (p_city IS NULL OR m.city = p_city)
    AND (p_museum_id IS NULL OR e.museum_id = p_museum_id)
    AND (
      NOT p_has_image OR (
        e.cover_image_url IS NOT NULL
        AND e.cover_image_url <> ''
        AND lower(e.cover_image_url) NOT IN ('n/a', 'null', 'undefined')
      )
    )
    AND (
      p_statuses IS NULL OR
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
      END = ANY(p_statuses)
    )
    AND (
      NOT p_closing_soon OR (
        e.end_date IS NOT NULL AND e.end_date >= v_today AND e.end_date <= v_today + interval '14 days'
      )
    )
    AND (
      p_date_from IS NULL OR (
        COALESCE(e.end_date, '9999-12-31'::date) >= p_date_from
      )
    )
    AND (
      p_date_to IS NULL OR (
        COALESCE(e.start_date, '0001-01-01'::date) <= p_date_to
      )
    );

  -- Page data with status-based sorting
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'data', COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT
      e.exhibition_id, e.museum_id, e.exhibition_name, e.cover_image_url,
      e.start_date, e.end_date, e.official_url, e.short_description, e.related_artworks,
      m.name as museum_name, m.city, m.state, m.country, m.lat as museum_lat, m.lng as museum_lng,
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
      END as status,
      CASE
        WHEN e.start_date IS NOT NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today < e.start_date THEN 1
               WHEN v_today > e.end_date THEN 2
               ELSE 0 END
        WHEN e.start_date IS NOT NULL AND e.end_date IS NULL THEN
          CASE WHEN v_today < e.start_date THEN 1 ELSE 0 END
        WHEN e.start_date IS NULL AND e.end_date IS NOT NULL THEN
          CASE WHEN v_today <= e.end_date THEN 0 ELSE 2 END
        ELSE 3
      END as status_rank
    FROM exhibitions e
    JOIN museums m ON m.museum_id = e.museum_id
    WHERE
      (p_search IS NULL OR (
        e.exhibition_name ILIKE '%' || p_search || '%' OR
        m.name ILIKE '%' || p_search || '%'
      ))
      AND (p_country IS NULL OR m.country = p_country)
      AND (p_state IS NULL OR m.state = p_state)
      AND (p_city IS NULL OR m.city = p_city)
      AND (p_museum_id IS NULL OR e.museum_id = p_museum_id)
      AND (
        NOT p_has_image OR (
          e.cover_image_url IS NOT NULL
          AND e.cover_image_url <> ''
          AND lower(e.cover_image_url) NOT IN ('n/a', 'null', 'undefined')
        )
      )
      AND (
        p_statuses IS NULL OR
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
        END = ANY(p_statuses)
      )
      AND (
        NOT p_closing_soon OR (
          e.end_date IS NOT NULL AND e.end_date >= v_today AND e.end_date <= v_today + interval '14 days'
        )
      )
      AND (
        p_date_from IS NULL OR (
          COALESCE(e.end_date, '9999-12-31'::date) >= p_date_from
        )
      )
      AND (
        p_date_to IS NULL OR (
          COALESCE(e.start_date, '0001-01-01'::date) <= p_date_to
        )
      )
    ORDER BY status_rank ASC,
      CASE WHEN status_rank = 0 THEN COALESCE(e.end_date, '9999-12-31'::date) END ASC,
      CASE WHEN status_rank = 1 THEN COALESCE(e.start_date, '9999-12-31'::date) END ASC,
      CASE WHEN status_rank = 2 THEN COALESCE(e.end_date, '0001-01-01'::date) END DESC,
      e.exhibition_name ASC
    OFFSET v_offset LIMIT p_page_size
  ) sub;

  RETURN v_result;
END;
$$;
