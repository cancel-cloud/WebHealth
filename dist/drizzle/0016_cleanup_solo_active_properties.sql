WITH active_linked_gsc AS (
  SELECT
    gsc.team_id,
    gsc.id AS gsc_id,
    ga4.id AS ga4_id,
    row_number() OVER (
      PARTITION BY gsc.team_id
      ORDER BY
        CASE WHEN gsc.url LIKE 'sc-domain:%' THEN 0 ELSE 1 END,
        ga4.name,
        gsc.id
    ) AS rank
  FROM properties gsc
  INNER JOIN properties ga4
    ON ga4.team_id = gsc.team_id
    AND ga4.id = 'ga4_' || gsc.ga4_property_id
    AND ga4.type = 'ga4'
    AND ga4.active = true
  INNER JOIN teams
    ON teams.id = gsc.team_id
    AND teams.tier = 'free'
  WHERE gsc.type = 'gsc'
    AND gsc.active = true
    AND gsc.ga4_property_id IS NOT NULL
),
solo_keep_ids AS (
  SELECT gsc_id AS id
  FROM active_linked_gsc
  WHERE rank = 1
  UNION
  SELECT ga4_id AS id
  FROM active_linked_gsc
  WHERE rank = 1
)
UPDATE properties
SET active = false
FROM teams
WHERE properties.team_id = teams.id
  AND teams.tier = 'free'
  AND properties.active = true
  AND NOT EXISTS (
    SELECT 1
    FROM solo_keep_ids
    WHERE solo_keep_ids.id = properties.id
  );
