
-- Create exhibitions table
CREATE TABLE public.exhibitions (
  exhibition_id text PRIMARY KEY,
  museum_id text NOT NULL REFERENCES public.museums(museum_id),
  exhibition_name text NOT NULL,
  cover_image_url text,
  start_date date,
  end_date date,
  official_url text,
  short_description text,
  related_artworks text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Exhibitions are publicly readable" ON public.exhibitions FOR SELECT USING (true);

-- Indexes for exhibitions
CREATE INDEX idx_exhibitions_museum_id ON public.exhibitions(museum_id);
CREATE INDEX idx_exhibitions_start_date ON public.exhibitions(start_date);
CREATE INDEX idx_exhibitions_end_date ON public.exhibitions(end_date);
CREATE INDEX idx_exhibitions_start_end ON public.exhibitions(start_date, end_date);

-- Indexes for museums (improve filtering)
CREATE INDEX idx_museums_country ON public.museums(country);
CREATE INDEX idx_museums_tags ON public.museums(tags);
CREATE INDEX idx_museums_highlight ON public.museums(highlight) WHERE highlight = true;
CREATE INDEX idx_museums_lat_lng ON public.museums(lat, lng);

-- Database function: paginated museums with filters
CREATE OR REPLACE FUNCTION public.get_museums_page(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20,
  p_search text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_highlight_only boolean DEFAULT false,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_max_distance_km double precision DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
DECLARE
  v_offset int;
  v_total bigint;
  v_result json;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count
  SELECT count(*) INTO v_total
  FROM museums m
  WHERE
    (p_search IS NULL OR (
      m.name ILIKE '%' || p_search || '%' OR
      m.city ILIKE '%' || p_search || '%'
    ))
    AND (p_country IS NULL OR m.country = p_country)
    AND (p_state IS NULL OR m.state = p_state)
    AND (p_city IS NULL OR m.city = p_city)
    AND (p_category IS NULL OR m.tags = p_category)
    AND (NOT p_highlight_only OR m.highlight = true)
    AND (
      p_lat IS NULL OR p_lng IS NULL OR p_max_distance_km IS NULL
      OR (
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(m.lat)) * cos(radians(m.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(m.lat))
          ))
        ) <= p_max_distance_km
      )
    );

  -- Get page data
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'data', COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT
      m.museum_id, m.name, m.city, m.state, m.country,
      m.lat, m.lng, m.address, m.website_url, m.opening_hours,
      m.has_full_content, m.hero_image_url, m.tags, m.highlight,
      CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        round((6371 * acos(
          least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(m.lat)) * cos(radians(m.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(m.lat))
          ))
        ))::numeric, 1)
      ELSE NULL END as distance_km
    FROM museums m
    WHERE
      (p_search IS NULL OR (
        m.name ILIKE '%' || p_search || '%' OR
        m.city ILIKE '%' || p_search || '%'
      ))
      AND (p_country IS NULL OR m.country = p_country)
      AND (p_state IS NULL OR m.state = p_state)
      AND (p_city IS NULL OR m.city = p_city)
      AND (p_category IS NULL OR m.tags = p_category)
      AND (NOT p_highlight_only OR m.highlight = true)
      AND (
        p_lat IS NULL OR p_lng IS NULL OR p_max_distance_km IS NULL
        OR (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(p_lat)) * cos(radians(m.lat)) * cos(radians(m.lng) - radians(p_lng))
              + sin(radians(p_lat)) * sin(radians(m.lat))
            ))
          ) <= p_max_distance_km
        )
      )
    ORDER BY
      CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(m.lat)) * cos(radians(m.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(m.lat))
          ))
        )
      ELSE 0 END ASC,
      m.name ASC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$$;

-- Database function: museums in viewport (for map)
CREATE OR REPLACE FUNCTION public.get_museums_in_bbox(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_category text DEFAULT NULL,
  p_highlight_only boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT museum_id, name, lat, lng, tags, highlight, city, country, state,
             hero_image_url, has_full_content, opening_hours, website_url, address
      FROM museums m
      WHERE m.lat BETWEEN p_south AND p_north
        AND (
          CASE WHEN p_west <= p_east
            THEN m.lng BETWEEN p_west AND p_east
            ELSE m.lng >= p_west OR m.lng <= p_east
          END
        )
        AND (p_category IS NULL OR m.tags = p_category)
        AND (NOT p_highlight_only OR m.highlight = true)
      ORDER BY m.name
    ) sub
  );
END;
$$;

-- Database function: paginated exhibitions with status sorting
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
  p_date_to date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
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
    ORDER BY
      status_rank ASC,
      CASE
        WHEN v_today >= COALESCE(e.start_date, '0001-01-01'::date) AND v_today <= COALESCE(e.end_date, '9999-12-31'::date) THEN COALESCE(e.end_date, '9999-12-31'::date)
        WHEN v_today < COALESCE(e.start_date, '9999-12-31'::date) THEN e.start_date
        ELSE NULL
      END ASC NULLS LAST,
      CASE WHEN v_today > COALESCE(e.end_date, '9999-12-31'::date) THEN e.end_date ELSE NULL END DESC NULLS LAST,
      e.exhibition_name ASC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$$;
